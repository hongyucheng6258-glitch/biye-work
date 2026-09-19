package com.campus.platform.module.site.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 容器存活检查接口。该接口不访问数据库或 Redis，避免把依赖服务状态
 * 与 Spring Boot 进程本身的启动状态混在一起。
 */
@RestController
public class HealthController {

    @GetMapping("/healthz")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
