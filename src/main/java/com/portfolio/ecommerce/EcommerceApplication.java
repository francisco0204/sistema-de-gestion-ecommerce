package com.portfolio.ecommerce;

import com.portfolio.ecommerce.model.Usuario;
import com.portfolio.ecommerce.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class EcommerceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EcommerceApplication.class, args);
    }

   @Bean
CommandLineRunner initData(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
    return args -> {
        if (usuarioRepository.count() == 0) {
            // Encriptamos la contraseña antes de guardar
            String passEncriptada = passwordEncoder.encode("123456");
            Usuario admin = new Usuario("Admin Portfolio", "admin@correo.com", "ADMIN", passEncriptada);
            usuarioRepository.save(admin);
            System.out.println("✅ Usuario Administrador encriptado creado con éxito!");
        }
    };
}
}