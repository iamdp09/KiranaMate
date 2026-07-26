package com.kiranaai.service;

import com.kiranaai.dto.request.CreateSupplierRequest;
import com.kiranaai.dto.response.SupplierResponse;
import com.kiranaai.exception.ResourceNotFoundException;
import com.kiranaai.model.Supplier;
import com.kiranaai.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public List<SupplierResponse> getAllSuppliers(String userId) {
        return supplierRepository.findByUserIdAndIsActiveTrue(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public SupplierResponse createSupplier(String userId, CreateSupplierRequest req) {
        Supplier supplier = Supplier.builder()
                .userId(userId)
                .name(req.name())
                .contactPerson(req.contactPerson())
                .phone(req.phone())
                .email(req.email())
                .address(req.address())
                .productsSupplied(new ArrayList<>())
                .isActive(true)
                .build();
        supplier = supplierRepository.save(supplier);
        log.info("Supplier created: {} for user: {}", supplier.getName(), userId);
        return toResponse(supplier);
    }

    public SupplierResponse getSupplierById(String userId, String id) {
        return supplierRepository.findByIdAndUserId(id, userId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
    }

    public SupplierResponse updateSupplier(String userId, String id, CreateSupplierRequest req) {
        Supplier supplier = supplierRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        supplier.setName(req.name());
        if (req.contactPerson() != null) supplier.setContactPerson(req.contactPerson());
        supplier.setPhone(req.phone());
        if (req.email() != null) supplier.setEmail(req.email());
        if (req.address() != null) supplier.setAddress(req.address());

        supplier = supplierRepository.save(supplier);
        return toResponse(supplier);
    }

    public void deleteSupplier(String userId, String id) {
        Supplier supplier = supplierRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        supplier.setActive(false);
        supplierRepository.save(supplier);
    }

    private SupplierResponse toResponse(Supplier s) {
        return SupplierResponse.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .name(s.getName())
                .contactPerson(s.getContactPerson())
                .phone(s.getPhone())
                .email(s.getEmail())
                .address(s.getAddress())
                .productsSupplied(s.getProductsSupplied())
                .isActive(s.isActive())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
