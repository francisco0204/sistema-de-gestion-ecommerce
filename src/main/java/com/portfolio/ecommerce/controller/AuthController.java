package com.portfolio.ecommerce.controller;
import com.portfolio.ecommerce.model.Usuario;
import com.portfolio.ecommerce.repository.UsuarioRepository;
import com.portfolio.ecommerce.config.JwtService; // Ajusta según tu carpeta
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Usuario loginData) {
        // Buscamos al usuario por el email que viene de React
        Optional<Usuario> userOpt = usuarioRepository.findByEmail(loginData.getEmail());

        if (userOpt.isPresent()) {
            Usuario user = userOpt.get();
            
            // VERIFICACIÓN: Comparamos la clave de React con el hash de la BD
            if (passwordEncoder.matches(loginData.getPassword(), user.getPassword())) {
                
                // Si la clave es correcta, generamos el Token
                String token = jwtService.generarToken(user.getEmail(), user.getRol());
                
                // Preparamos la respuesta con Usuario + Token
                Map<String, Object> respuesta = new HashMap<>();
                respuesta.put("usuario", user);
                respuesta.put("token", token);
                
                return ResponseEntity.ok(respuesta);
            }
        }
        
        // Si el usuario no existe o la clave no coincide
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales incorrectas");
    }
    @PutMapping("/actualizar")
public ResponseEntity<?> actualizarPerfil(@RequestBody Map<String, String> datos, @RequestHeader("Authorization") String token) {
    try {
        // 1. Limpiar el token (Bearer ...)
        String emailActual = jwtService.extraerEmail(token.replace("Bearer ", ""));

        Optional<Usuario> userOpt = usuarioRepository.findByEmail(emailActual);
        
        if (userOpt.isPresent()) {
            Usuario user = userOpt.get();
            
            // Actualizamos nombre
            if (datos.get("nombre") != null) {
                user.setNombre(datos.get("nombre"));
            }
            
            // Actualizamos password solo si no está vacío
            if (datos.get("password") != null && !datos.get("password").trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(datos.get("password")));
            }

            usuarioRepository.save(user);
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(404).body("Usuario no encontrado");
    } catch (Exception e) {
        return ResponseEntity.status(500).body("Error interno: " + e.getMessage());
    }
}
}

