package com.kiranaai.repository;

import com.kiranaai.model.InventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryLogRepository extends MongoRepository<InventoryLog, String> {

    Page<InventoryLog> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<InventoryLog> findByUserIdAndProductIdOrderByCreatedAtDesc(
            String userId, String productId);
}
