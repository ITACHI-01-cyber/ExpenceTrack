package com.expensetracker.dto;

import lombok.Data;

/** Nullable patch fields: omitted JSON fields must not reset existing settings. */
@Data
public class UserSettingsUpdate {
    private String name;
    private String profilePicture;
    private String theme;
    private String currency;
    private Boolean gmailConnected;
    private String accentColor;
    private Boolean glass;
    private String wallpaperId;
    private String wallpaperImage;
    private Integer wallpaperOpacity;
    private Boolean wallpaperEnabled;
}
