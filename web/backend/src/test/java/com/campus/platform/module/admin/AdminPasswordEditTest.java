package com.campus.platform.module.admin;

import com.campus.platform.module.admin.dto.AdminSaveDTO;
import com.campus.platform.module.admin.entity.Admin;
import com.campus.platform.module.admin.mapper.AdminMapper;
import com.campus.platform.module.admin.service.AdminPermissionService;
import com.campus.platform.module.admin.service.AdminUserService;
import com.campus.platform.module.auth.service.AuthService;
import com.campus.platform.module.user.mapper.UserMapper;
import com.campus.platform.utils.RedisUtils;
import com.campus.platform.common.BizException;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminPasswordEditTest {
    private AdminSaveDTO dto(String password) {
        AdminSaveDTO dto = new AdminSaveDTO();
        dto.setUsername("qa-editor"); dto.setNickname("Edited nickname");
        dto.setRole("audit"); dto.setPassword(password);
        return dto;
    }

    @Test void editValidationAllowsEmptyOrOmittedPassword() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertThat(factory.getValidator().validate(dto(""))).isEmpty();
            assertThat(factory.getValidator().validate(dto(null))).isEmpty();
        }
    }

    @Test void usernameAndRoleStillRequireValidValues() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var input = dto(""); input.setUsername(""); input.setRole("student");
            assertThat(factory.getValidator().validate(input)).extracting(v -> v.getPropertyPath().toString())
                .contains("username", "role");
        }
    }

    @Test void blankPasswordEditPreservesStoredHashAndExplicitPasswordStillChangesIt() {
        var mapper = mock(AdminMapper.class); var auth = mock(AuthService.class);
        var service = new AdminUserService(mock(UserMapper.class), mapper, auth, mock(RedisUtils.class), mock(AdminPermissionService.class));
        var existing = new Admin(); existing.setId(11L); existing.setRole("audit"); existing.setPassword("existing-hash");
        when(mapper.selectById(11L)).thenReturn(existing);
        var edited = service.updateAdmin(11L, dto(""));
        assertThat(edited.getPassword()).isEqualTo("existing-hash");
        assertThat(edited.getNickname()).isEqualTo("Edited nickname");
        verify(auth, never()).encode(any());
        when(auth.encode("new-password")).thenReturn("new-hash");
        assertThat(service.updateAdmin(11L, dto("new-password")).getPassword()).isEqualTo("new-hash");
    }

    @Test void creationStillRejectsEmptyAndOmittedInitialPassword() {
        var mapper = mock(AdminMapper.class);
        when(mapper.selectCount(any())).thenReturn(0L);
        var service = new AdminUserService(mock(UserMapper.class), mapper, mock(AuthService.class), mock(RedisUtils.class), mock(AdminPermissionService.class));
        assertThatThrownBy(() -> service.createAdmin(dto(""))).isInstanceOf(BizException.class).hasMessage("初始密码不能为空");
        assertThatThrownBy(() -> service.createAdmin(dto(null))).isInstanceOf(BizException.class).hasMessage("初始密码不能为空");
        verify(mapper, never()).insert(any(Admin.class));
    }
}
