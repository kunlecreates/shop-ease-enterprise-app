package org.kunlecreates.user.interfaces;

import jakarta.validation.Valid;
import org.kunlecreates.user.application.UserService;
import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.interfaces.dto.CreateUserRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> list() {
        return userService.listUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> get(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Void> create(@Valid @RequestBody CreateUserRequest req, UriComponentsBuilder uriBuilder) {
        // For demo: password is expected to be pre-hashed by client; in real app hash server-side
        User created = userService.createUser(req.email(), req.password());
        URI location = uriBuilder.path("/api/users/{id}").buildAndExpand(created.getId()).toUri();
        return ResponseEntity.created(location).build();
    }
}
