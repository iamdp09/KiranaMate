package com.kiranaai.config;

import org.springframework.context.annotation.Configuration;

/**
 * MongoDB configuration class.
 * Note: @EnableMongoAuditing is already declared on KiranaAiApplication,
 * so it is NOT repeated here to avoid duplicate bean registration.
 */
@Configuration
public class MongoConfig {
    // Add custom MongoConverters here if needed in future
}
