package com.expensetracker.service;

import java.io.IOException;

/** Durable public object storage used for user images. */
public interface MediaObjectStore {
    String upload(byte[] contents, String publicId, String contentType) throws IOException;
}
