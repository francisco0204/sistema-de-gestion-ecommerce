package com.portfolio.ecommerce.repository;

import com.portfolio.ecommerce.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    // Al extender JpaRepository, Spring nos regala automáticamente métodos como:
    // save() para guardar, findAll() para buscar todos, findById() para buscar uno, etc.
}