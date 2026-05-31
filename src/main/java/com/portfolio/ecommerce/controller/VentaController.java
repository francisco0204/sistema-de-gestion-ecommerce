package com.portfolio.ecommerce.controller;

import com.portfolio.ecommerce.model.Producto;
import com.portfolio.ecommerce.model.Venta;
import com.portfolio.ecommerce.repository.ProductoRepository;
import com.portfolio.ecommerce.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin("*")
public class VentaController {

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    // POST /api/ventas/comprar/1?cantidad=2
    @PostMapping("/comprar/{productoId}")
    public ResponseEntity<?> comprarProducto(@PathVariable Long productoId, @RequestParam Integer cantidad) {
        
        // 1. Buscamos el producto en la base de datos
        Producto producto = productoRepository.findById(productoId).orElse(null);
        
        if (producto == null) {
            return ResponseEntity.badRequest().body("Error: El producto no existe.");
        }

        // 2. REGLA DE NEGOCIO: ¿Hay stock suficiente?
        if (producto.getStock() < cantidad) {
            return ResponseEntity.badRequest().body("Error: Stock insuficiente. Solo quedan " + producto.getStock());
        }

        // 3. Descontamos el stock y guardamos el producto actualizado
        producto.setStock(producto.getStock() - cantidad);
        productoRepository.save(producto);

        // 4. Creamos el registro de la venta (El "Ticket")
        Venta nuevaVenta = new Venta();
        nuevaVenta.setProducto(producto);
        nuevaVenta.setCantidad(cantidad);
        nuevaVenta.setFecha(LocalDateTime.now()); // Hora actual del servidor
        ventaRepository.save(nuevaVenta);

        return ResponseEntity.ok("Venta realizada con éxito. Nuevo stock: " + producto.getStock());
    }
    // GET /api/ventas
    // Devuelve el historial completo de ventas
    @GetMapping
    public ResponseEntity<?> obtenerHistorialVentas() {
        return ResponseEntity.ok(ventaRepository.findAll());
    }
}