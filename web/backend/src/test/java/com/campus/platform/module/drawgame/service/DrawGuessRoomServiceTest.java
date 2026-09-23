package com.campus.platform.module.drawgame.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.campus.platform.common.BizException;
import com.campus.platform.module.drawgame.dto.DrawGuessCreateRoomDTO;
import com.campus.platform.module.drawgame.entity.DrawGuessMember;
import com.campus.platform.module.drawgame.entity.DrawGuessRoom;
import com.campus.platform.module.drawgame.mapper.DrawGuessMemberMapper;
import com.campus.platform.module.drawgame.mapper.DrawGuessRoomMapper;
import com.campus.platform.module.drawgame.mapper.DrawGuessRoundMapper;
import com.campus.platform.module.drawgame.mapper.DrawGuessWordMapper;
import com.campus.platform.module.drawgame.vo.DrawGuessRoomVO;
import com.campus.platform.module.drawgame.websocket.DrawGuessSessionRegistry;
import com.campus.platform.module.upload.mapper.UploadResourceMapper;
import com.campus.platform.module.upload.service.UploadService;
import com.campus.platform.module.user.entity.User;
import com.campus.platform.module.user.mapper.UserMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DrawGuessRoomServiceTest {
    private final DrawGuessRoomMapper roomMapper = mock(DrawGuessRoomMapper.class);
    private final DrawGuessMemberMapper memberMapper = mock(DrawGuessMemberMapper.class);
    private final DrawGuessRoundMapper roundMapper = mock(DrawGuessRoundMapper.class);
    private final DrawGuessWordMapper wordMapper = mock(DrawGuessWordMapper.class);
    private final UserMapper userMapper = mock(UserMapper.class);
    private final UploadResourceMapper uploadResourceMapper = mock(UploadResourceMapper.class);
    private final UploadService uploadService = mock(UploadService.class);
    private final DrawGuessSessionRegistry sessions = new DrawGuessSessionRegistry(new ObjectMapper());
    private final List<DrawGuessMember> members = new ArrayList<>();
    private DrawGuessRoomService service;
    private DrawGuessRoom insertedRoom;

    @BeforeEach
    void setUp() {
        service = new DrawGuessRoomService(roomMapper, memberMapper, roundMapper, wordMapper,
                userMapper, uploadResourceMapper, uploadService, sessions);
        User owner = new User();
        owner.setId(7L);
        owner.setNickname("画手小林");
        owner.setAvatar("/uploads/avatar.png");
        owner.setStatus(0);
        when(userMapper.selectById(7L)).thenReturn(owner);
        User returningPlayer = new User();
        returningPlayer.setId(8L);
        returningPlayer.setNickname("小周");
        returningPlayer.setStatus(0);
        when(userMapper.selectById(8L)).thenReturn(returningPlayer);
        when(roomMapper.selectCount(any(QueryWrapper.class))).thenReturn(0L);
        when(roomMapper.selectOne(any(QueryWrapper.class))).thenAnswer(invocation -> insertedRoom);
        when(roomMapper.insert(any(DrawGuessRoom.class))).thenAnswer(invocation -> {
            insertedRoom = invocation.getArgument(0);
            insertedRoom.setId(88L);
            return 1;
        });
        when(memberMapper.insert(any(DrawGuessMember.class))).thenAnswer(invocation -> {
            members.add(invocation.getArgument(0));
            return 1;
        });
        when(memberMapper.selectOne(any(QueryWrapper.class))).thenAnswer(invocation -> members.stream()
                .filter(member -> member.getRoomId().equals(insertedRoom.getId()))
                .findFirst().orElse(null));
        when(memberMapper.selectList(any(QueryWrapper.class))).thenAnswer(invocation -> members.stream()
                .filter(member -> Boolean.TRUE.equals(member.getActive())).toList());
        when(memberMapper.updateById(any(DrawGuessMember.class))).thenReturn(1);
        when(roomMapper.updateById(any(DrawGuessRoom.class))).thenReturn(1);
    }

    @AfterEach
    void stopTimerPool() {
        service.stopTimers();
    }

    @Test
    void privateRoomKeepsPasswordHashedAndNeverReturnsItInRoomView() throws Exception {
        DrawGuessCreateRoomDTO request = new DrawGuessCreateRoomDTO();
        request.setTitle("课间速写");
        request.setPrivateRoom(true);
        request.setPassword("secret123");

        DrawGuessRoomVO view = service.createRoom(7L, request);
        String json = new ObjectMapper().writeValueAsString(view);

        assertTrue(insertedRoom.getPasswordHash().startsWith("$2"));
        assertNotEquals("secret123", insertedRoom.getPasswordHash());
        assertFalse(json.contains("secret123"));
        assertFalse(json.contains("passwordHash"));
        assertEquals(1, view.playerCount());
        assertTrue(view.isOwner());
    }

    @Test
    void ownerCanCloseTheirEmptyWaitingRoomAndItCannotBeReopened() {
        DrawGuessRoomVO created = service.createRoom(7L, new DrawGuessCreateRoomDTO());

        DrawGuessRoomVO afterLeave = service.leaveRoom(created.id(), 7L);

        assertEquals("FINISHED", afterLeave.status());
        assertEquals(0, afterLeave.playerCount());
        assertFalse(members.get(0).getActive());
        assertThrows(BizException.class, () -> service.getRoom(created.id(), 7L));
    }

    @Test
    void returningPlayerGetsAnUnoccupiedSeatAfterLeavingAndRejoining() {
        AtomicInteger membershipLookups = new AtomicInteger();
        org.mockito.Mockito.doAnswer(invocation -> membershipLookups.getAndIncrement() == 0
                ? null : members.get(0)).when(memberMapper).selectOne(any(QueryWrapper.class));
        DrawGuessRoomVO created = service.createRoom(7L, new DrawGuessCreateRoomDTO());
        service.joinRoom(8L, created.roomCode(), null);
        service.leaveRoom(created.id(), 7L);

        DrawGuessRoomVO rejoined = service.joinRoom(7L, created.roomCode(), null);
        List<Integer> occupiedSeats = members.stream().filter(member -> Boolean.TRUE.equals(member.getActive()))
                .map(DrawGuessMember::getSeatNo).toList();

        assertEquals(2, rejoined.playerCount());
        assertEquals(2, occupiedSeats.stream().distinct().count());
        assertTrue(occupiedSeats.contains(1));
        assertTrue(occupiedSeats.contains(2));
    }
}
