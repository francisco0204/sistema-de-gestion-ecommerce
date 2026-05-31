package com.portfolio.ecommerce.repository;

import com.portfolio.ecommerce.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Este es el que necesita el AuthController ahora:
    Optional<Usuario> findByEmail(String email);
}