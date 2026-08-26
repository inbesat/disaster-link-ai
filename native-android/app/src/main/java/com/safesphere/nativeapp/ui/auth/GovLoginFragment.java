package com.safesphere.nativeapp.ui.auth;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import androidx.navigation.Navigation;

import com.google.android.material.textfield.TextInputEditText;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.base.BaseFragment;
import com.safesphere.nativeapp.util.RoleManager;

public class GovLoginFragment extends BaseFragment {

    @Override protected int getLayoutRes() { return R.layout.fragment_gov_login; }

    @Override protected void initViews(View view) {
        Button loginBtn = view.findViewById(R.id.govLoginBtn);
        Button backBtn = view.findViewById(R.id.backToPublicBtn);

        loginBtn.setOnClickListener(v -> {
            TextInputEditText email = view.findViewById(R.id.govEmailInput);
            TextInputEditText pass = view.findViewById(R.id.govPasswordInput);
            String emailStr = email.getText() == null ? "" : email.getText().toString().trim();
            if (emailStr.isEmpty()) {
                email.setError("Official email required");
                return;
            }
            // Demo: super admin for admin@ emails, district admin otherwise
            RoleManager.Role role = emailStr.startsWith("admin@")
                    ? RoleManager.Role.SUPER_ADMIN : RoleManager.Role.DISTRICT_ADMIN;
            roleManager.setRole(role);
            roleManager.setUserId(emailStr);
            roleManager.setGuestMode(false);
            Toast.makeText(requireContext(), "Signed in as " + role.value, Toast.LENGTH_SHORT).show();
            Navigation.findNavController(view).navigate(R.id.govDashboardFragment);
        });

        backBtn.setOnClickListener(v -> requireActivity().onBackPressed());
    }
}