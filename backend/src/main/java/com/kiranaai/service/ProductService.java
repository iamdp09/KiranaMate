package com.kiranaai.service;

import com.kiranaai.dto.request.CreateProductRequest;
import com.kiranaai.dto.request.UpdateProductRequest;
import com.kiranaai.dto.response.PagedResponse;
import com.kiranaai.dto.response.ProductResponse;
import com.kiranaai.exception.BadRequestException;
import com.kiranaai.exception.ResourceNotFoundException;
import com.kiranaai.model.Product;
import com.kiranaai.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;

    public PagedResponse<ProductResponse> getAllProducts(String userId, int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Product> productPage;

        if (search != null && !search.isBlank()) {
            productPage = productRepository.findByUserIdAndIsActiveTrueAndNameContainingIgnoreCase(userId, search, pageable);
        } else {
            productPage = productRepository.findByUserIdAndIsActiveTrue(userId, pageable);
        }

        return PagedResponse.of(productPage.map(this::toResponse));
    }

    public ProductResponse createProduct(String userId, CreateProductRequest req) {
        Product product = Product.builder()
                .userId(userId)
                .name(req.name())
                .sku(req.sku())
                .category(req.category())
                .unit(req.unit())
                .sellingPrice(req.sellingPrice())
                .costPrice(req.costPrice())
                .currentStock(req.currentStock())
                .reorderThreshold(req.reorderThreshold())
                .maxStock(req.maxStock() != null ? req.maxStock() : req.reorderThreshold() * 10)
                .supplierId(req.supplierId())
                .isActive(true)
                .build();

        product = productRepository.save(product);
        log.info("Product created: {} for user: {}", product.getName(), userId);
        return toResponse(product);
    }

    public ProductResponse getProductById(String userId, String id) {
        Product product = productRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return toResponse(product);
    }

    public ProductResponse updateProduct(String userId, String id, UpdateProductRequest req) {
        Product product = productRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        if (req.getName() != null) product.setName(req.getName());
        if (req.getSku() != null) product.setSku(req.getSku());
        if (req.getCategory() != null) product.setCategory(req.getCategory());
        if (req.getUnit() != null) product.setUnit(req.getUnit());
        if (req.getSellingPrice() != null) product.setSellingPrice(req.getSellingPrice());
        if (req.getCostPrice() != null) product.setCostPrice(req.getCostPrice());
        if (req.getReorderThreshold() != null) product.setReorderThreshold(req.getReorderThreshold());
        if (req.getMaxStock() != null) product.setMaxStock(req.getMaxStock());
        if (req.getSupplierId() != null) product.setSupplierId(req.getSupplierId());
        if (req.getImageUrl() != null) product.setImageUrl(req.getImageUrl());

        product = productRepository.save(product);
        log.info("Product updated: {} for user: {}", product.getName(), userId);
        return toResponse(product);
    }

    public void deleteProduct(String userId, String id) {
        Product product = productRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setActive(false);
        productRepository.save(product);
        log.info("Product soft-deleted: {} for user: {}", id, userId);
    }

    public List<ProductResponse> getLowStockProducts(String userId) {
        return productRepository.findLowStockByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<String> getCategories(String userId) {
        return productRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(Product::getCategory)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public ProductResponse toResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .name(p.getName())
                .sku(p.getSku())
                .category(p.getCategory())
                .unit(p.getUnit())
                .sellingPrice(p.getSellingPrice())
                .costPrice(p.getCostPrice())
                .currentStock(p.getCurrentStock())
                .reorderThreshold(p.getReorderThreshold())
                .maxStock(p.getMaxStock())
                .supplierId(p.getSupplierId())
                .imageUrl(p.getImageUrl())
                .isActive(p.isActive())
                .isLowStock(p.getCurrentStock() != null && p.getReorderThreshold() != null
                        && p.getCurrentStock() <= p.getReorderThreshold())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
