package com.campus.platform.module.drawgame.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DrawGuessSessionRegistryTest {
    private DrawGuessSessionRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new DrawGuessSessionRegistry(new ObjectMapper());
    }

    @Test
    void broadcastsOnlyInsideTheTargetRoomAndCountsUsersOnceAcrossTabs() throws Exception {
        WebSocketSession firstTab = session("first", 10L, 101L);
        WebSocketSession secondTab = session("second", 10L, 101L);
        WebSocketSession otherRoom = session("other", 20L, 202L);
        registry.register(10L, firstTab);
        registry.register(10L, secondTab);
        registry.register(20L, otherRoom);

        assertEquals(1, registry.onlineCount(10L));
        assertEquals(1, registry.onlineCount(20L));
        registry.broadcast(10L, Map.of("type", "room_state"));

        verify(firstTab).sendMessage(any(TextMessage.class));
        verify(secondTab).sendMessage(any(TextMessage.class));
        verify(otherRoom, never()).sendMessage(any(TextMessage.class));
    }

    @Test
    void unregisterRemovesOnlyTheClosedSession() {
        WebSocketSession firstTab = session("first", 10L, 101L);
        WebSocketSession secondTab = session("second", 10L, 101L);
        registry.register(10L, firstTab);
        registry.register(10L, secondTab);

        registry.unregister(firstTab);

        assertEquals(1, registry.onlineCount(10L));
    }

    private WebSocketSession session(String sessionId, Long roomId, Long userId) {
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn(sessionId);
        when(session.getAttributes()).thenReturn(Map.of(
                DrawGuessSessionRegistry.ROOM_ID_ATTRIBUTE, roomId,
                DrawGuessSessionRegistry.USER_ID_ATTRIBUTE, userId));
        when(session.isOpen()).thenReturn(true);
        return session;
    }
}
