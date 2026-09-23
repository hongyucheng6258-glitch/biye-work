package com.campus.platform.module.drawgame.db;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DrawGuessMigrationTest {
    private static final String START = "-- BEGIN draw guess schema";
    private static final String END = "-- END draw guess schema";

    @Test
    void freshInstallDockerAndUpgradeScriptsShareTheSameAdditiveSchema() throws IOException {
        String migration = readResource("db/migrate_v8_draw_guess.sql");
        String schema = readResource("db/schema.sql");
        String dockerInit = Files.readString(Path.of("../../docker/mysql/02-app-extension.sql"), StandardCharsets.UTF_8);
        String expectedBlock = block(migration);

        assertEquals(expectedBlock, block(schema));
        assertEquals(expectedBlock, block(dockerInit));
        for (String table : new String[]{"draw_game_room", "draw_game_member", "draw_game_round", "draw_game_word"}) {
            assertTrue(expectedBlock.contains("CREATE TABLE IF NOT EXISTS `" + table + "`"),
                    () -> "迁移缺少新表: " + table);
        }
        assertTrue(expectedBlock.contains("ON DUPLICATE KEY UPDATE"), "词库种子必须允许重复执行");
    }

    @Test
    void gameSchemaAddsReferentialIntegrityAndKeepsUsefulLookupIndexes() throws IOException {
        String block = block(readResource("db/migrate_v8_draw_guess.sql"));

        assertTrue(block.contains("FOREIGN KEY (`room_id`) REFERENCES `draw_game_room` (`id`)"));
        assertTrue(block.contains("FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)"));
        assertTrue(block.contains("UNIQUE KEY `uk_draw_game_member_room_user` (`room_id`, `user_id`)"));
        assertTrue(block.contains("KEY `idx_draw_game_member_recent` (`user_id`, `last_visited_at`)"));
        assertTrue(block.contains("KEY `idx_draw_game_round_gallery` (`status`, `ended_at`)"));
    }

    private static String readResource(String path) throws IOException {
        try (var stream = DrawGuessMigrationTest.class.getClassLoader().getResourceAsStream(path)) {
            if (stream == null) throw new IOException("找不到资源: " + path);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static String block(String sql) {
        int start = sql.indexOf(START);
        int end = sql.indexOf(END, start);
        if (start < 0 || end < 0) throw new AssertionError("SQL缺少完整的你画我猜区块标记");
        return sql.substring(start, end + END.length()).trim();
    }
}
