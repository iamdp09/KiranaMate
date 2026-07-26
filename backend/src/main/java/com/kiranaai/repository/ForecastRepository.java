package com.kiranaai.repository;

import com.kiranaai.model.Forecast;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForecastRepository extends MongoRepository<Forecast, String> {

    List<Forecast> findByUserIdOrderByGeneratedAtDesc(String userId);

    Optional<Forecast> findTopByUserIdAndProductIdOrderByGeneratedAtDesc(
            String userId, String productId);
}
