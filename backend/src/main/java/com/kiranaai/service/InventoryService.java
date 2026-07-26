package com.kiranaai.service;

import com.kiranaai.dto.request.AdjustStockRequest;
import com.kiranaai.dto.response.InventoryLogResponse;
import com.kiranaai.dto.response.PagedResponse;
import com.kiranaai.dto.response.ProductResponse;
import com.kiranaai.exception.BadRequestException;
import com.kiranaai.exception.ResourceNotFoundException;
import com.kiranaai.model.InventoryChangeType;
import com.kiranaai.model.InventoryLog;
import com.kiranaai.model.Product;
import com.kiranaai.repository.InventoryLogRepository;
import com.kiranaai.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final ProductRepository productRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final ProductService productService;

    public List<ProductResponse> getAllInventory(String userId) {
        return productRepository.findByUserIdAndIsActiveTrue(userId)
                .stream().map(productService::toResponse).collect(Collectors.toList());
    }

    public ProductResponse adjustStock(String userId, String productId, AdjustStockRequest req) {
        Product product = productRepository.findByIdAndUserId(productId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        int before = product.getCurrentStock();
        int after = before + req.quantityChange();

        if (after < 0) {
            throw new BadRequestException("Insufficient stock. Current: " + before
                    + ", requested deduction: " + Math.abs(req.quantityChange()));
        }

        product.setCurrentStock(after);
        productRepository.save(product);

        logChange(userId, productId, InventoryChangeType.MANUAL_ADJUST, before, req.quantityChange(),
                req.note() != null ? req.note() : "Manual stock adjustment");

        log.info("Stock adjusted for product {} by {}", productId, req.quantityChange());
        return productService.toResponse(product);
    }

    public ProductResponse restockProduct(String userId, String productId, int qty, String note) {
        if (qty <= 0) throw new BadRequestException("Restock quantity must be positive");

        Product product = productRepository.findByIdAndUserId(productId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        int before = product.getCurrentStock();
        product.setCurrentStock(before + qty);
        productRepository.save(product);

        logChange(userId, productId, InventoryChangeType.RESTOCK, before, qty,
                note != null ? note : "Manual restock");

        return productService.toResponse(product);
    }

    public PagedResponse<InventoryLogResponse> getAllLogs(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.of(inventoryLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toLogResponse));
    }

    public List<InventoryLogResponse> getProductLogs(String userId, String productId) {
        return inventoryLogRepository.findByUserIdAndProductIdOrderByCreatedAtDesc(userId, productId)
                .stream().map(this::toLogResponse).collect(Collectors.toList());
    }

    private void logChange(String userId, String productId, InventoryChangeType type,
                           int before, int change, String note) {
        InventoryLog log = InventoryLog.builder()
                .userId(userId)
                .productId(productId)
                .changeType(type)
                .quantityBefore(before)
                .quantityChange(change)
                .quantityAfter(before + change)
                .note(note)
                .build();
        inventoryLogRepository.save(log);
    }

    private InventoryLogResponse toLogResponse(InventoryLog l) {
        return InventoryLogResponse.builder()
                .id(l.getId())
                .userId(l.getUserId())
                .productId(l.getProductId())
                .changeType(l.getChangeType() != null ? l.getChangeType().name() : null)
                .quantityBefore(l.getQuantityBefore())
                .quantityChange(l.getQuantityChange())
                .quantityAfter(l.getQuantityAfter())
                .note(l.getNote())
                .createdAt(l.getCreatedAt())
                .build();
    }
}
