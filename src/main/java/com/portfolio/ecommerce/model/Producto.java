package com.portfolio.ecommerce.model;

import jakarta.persistence.*; // Importamos las herramientas para conectar con la BD

@Entity // Esto le dice a Java: "Esta clase es una tabla de la base de datos"
@Table(name = "productos") // Le decimos exactamente a qué tabla se refiere
public class Producto {

    @Id // Define que este atributo es la Clave Primaria (ID)
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Hace que el ID sea auto-incremental
    private Long id;

    private String nombre;
    private Double precio;
    private Integer stock;

    // --- NUEVO CÓDIGO A AGREGAR ---
    @ManyToOne // Muchos productos pertenecen a un usuario
    @JoinColumn(name = "usuario_id") // El nombre de la columna en MySQL
    private Usuario usuario;
    // -----------------------------

    // IMPORTANTE: Recuerda generar los Getters y Setters para este nuevo atributo al final del archivo:
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    // --- AQUÍ EMPIEZA LO QUE ESTÁS VIENDO EN POO ---

    // Constructor vacío (Obligatorio para Spring)
    public Producto() {
    }

    // Constructor con parámetros
    public Producto(String nombre, Double precio, Integer stock) {
        this.nombre = nombre;
        this.precio = precio;
        this.stock = stock;
    }

    // Getters y Setters (Necesarios para que Spring pueda leer y escribir datos)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
}