package com.expensetracker.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Path;

public interface UserMediaService {
    String store(MultipartFile file, String userId, String purpose) throws IOException;
    String migrate(Path source, String userId, String purpose) throws IOException;
    Path resolve(String filename);
}
