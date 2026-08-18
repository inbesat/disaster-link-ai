package com.safesphere.nativeapp.util;

import android.content.Context;
import android.content.SharedPreferences;

public class RoleManager {
    private static final String PREFS_NAME = "safesphere_auth";
    private static final String KEY_ROLE = "user_role";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_DISTRICT = "user_district";
    private static final String KEY_GUEST_MODE = "guest_mode";
    private static final String KEY_VIEW_AS_PUBLIC = "view_as_public";

    private final SharedPreferences prefs;

    public RoleManager(Context context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public enum Role {
        SUPER_ADMIN("super_admin"),
        DISTRICT_ADMIN("district_admin"),
        FIELD_RESPONDER("field_responder"),
        VIEWER("viewer"),
        PUBLIC("public"),
        GUEST("guest"),
        NONE("none");

        public final String value;
        Role(String value) { this.value = value; }
    }

    public void setRole(Role role) {
        prefs.edit().putString(KEY_ROLE, role.value).apply();
    }

    public Role getRole() {
        String roleStr = prefs.getString(KEY_ROLE, Role.NONE.value);
        for (Role r : Role.values()) {
            if (r.value.equals(roleStr)) return r;
        }
        return Role.NONE;
    }

    public void setUserId(String userId) {
        prefs.edit().putString(KEY_USER_ID, userId).apply();
    }

    public String getUserId() {
        return prefs.getString(KEY_USER_ID, null);
    }

    public void setDistrict(String district) {
        prefs.edit().putString(KEY_DISTRICT, district).apply();
    }

    public String getDistrict() {
        return prefs.getString(KEY_DISTRICT, "Patna");
    }

    public void setGuestMode(boolean guest) {
        prefs.edit().putBoolean(KEY_GUEST_MODE, guest).apply();
    }

    public boolean isGuestMode() {
        return prefs.getBoolean(KEY_GUEST_MODE, false);
    }

    public void setViewAsPublic(boolean viewAsPublic) {
        prefs.edit().putBoolean(KEY_VIEW_AS_PUBLIC, viewAsPublic).apply();
    }

    public boolean isViewAsPublic() {
        return prefs.getBoolean(KEY_VIEW_AS_PUBLIC, false);
    }

    public void clear() {
        prefs.edit().clear().apply();
    }

    public boolean isGovRole() {
        Role role = getRole();
        return role == Role.SUPER_ADMIN || role == Role.DISTRICT_ADMIN || role == Role.FIELD_RESPONDER;
    }

    public boolean isAdminRole() {
        Role role = getRole();
        return role == Role.SUPER_ADMIN || role == Role.DISTRICT_ADMIN;
    }

    public boolean isPublicRole() {
        Role role = getRole();
        return role == Role.PUBLIC || role == Role.GUEST;
    }
}