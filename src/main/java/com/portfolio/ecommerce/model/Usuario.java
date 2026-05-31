package com.portfolio.ecommerce.model;

import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    private String rol; // "ADMIN" o "CAJERO"
    private String password;

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    @JsonIgnore 
    private List<Producto> productos;

    public Usuario() {}

    public Usuario(String nombre, String email, String rol, String password) {
        this.nombre = nombre;
        this.email = email;
        this.rol = rol; // <--- Faltaba asignar esto
        this.password = password;
    }

    // Getters y Setters (Asegúrate de tener TODOS estos)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRol() { return rol; } // <--- Faltaba
    public void setRol(String rol) { this.rol = rol; } // <--- Faltaba
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public List<Producto> getProductos() { return productos; }
    public void setProductos(List<Producto> productos) { this.productos = productos; }
}