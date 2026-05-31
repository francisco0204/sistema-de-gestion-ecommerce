package com.portfolio.ecommerce.controller;

import com.portfolio.ecommerce.model.Producto;
import com.portfolio.ecommerce.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // Indica que esta clase responderá peticiones web (creará una API REST)
@RequestMapping("/api/productos") // La URL base para todo lo de aquí adentro
@CrossOrigin("*") // IMPORTANTE: Permite que React (que estará en otro puerto) se comunique sin errores
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    // 1. Método para ver todos los productos (GET)
    @GetMapping
    public List<Producto> obtenerTodos() {
        return productoRepository.findAll(); // Busca en MySQL y devuelve un JSON
    }

    // 2. Método para crear un nuevo producto (POST)
    @PostMapping
    public Producto crearProducto(@RequestBody Producto producto) {
        return productoRepository.save(producto); // Recibe un JSON y lo guarda en MySQL
    }

    // 3. Método para borrar un producto (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarProducto(@PathVariable Long id) {
        try {
            // Intentamos borrar el producto por su ID
            productoRepository.deleteById(id);
            return ResponseEntity.ok("Producto eliminado correctamente.");
        } catch (Exception e) {
            // Si MySQL lanza un error (seguramente porque tiene ventas asociadas), lo atajamos aquí
            return ResponseEntity.badRequest().body("Error: No puedes borrar un producto que ya tiene ventas registradas en el sistema.");
        }
    }

    // 4. Método para actualizar un producto (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarProducto(@PathVariable Long id, @RequestBody Producto productoActualizado) {
        // Buscamos si el producto existe
        Producto productoExistente = productoRepository.findById(id).orElse(null);
        
        if (productoExistente == null) {
            return ResponseEntity.badRequest().body("Error: El producto no existe.");
        }

        // Actualizamos sus datos con lo que nos llega desde React
        productoExistente.setNombre(productoActualizado.getNombre());
        productoExistente.setPrecio(productoActualizado.getPrecio());
        productoExistente.setStock(productoActualizado.getStock());
        
        // Guardamos los cambios
        productoRepository.save(productoExistente);
        
        return ResponseEntity.ok("Producto actualizado correctamente.");
    }
}