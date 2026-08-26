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

public class LoginFragment extends BaseFragment {

    @Override protected int getLayoutRes() { return R.layout.fragment_login; }

    @Override protected void initViews(View view) {
        Button loginBtn = view.findViewById(R.id.loginBtn);
        Button govBtn = view.findViewById(R.id.govLoginBtn);
        Button otpBtn = view.findViewById(R.id.otpLoginBtn);

        loginBtn.setOnClickListener(v -> {
            TextInputEditText email = view.findViewById(R.id.emailInput);
            TextInputEditText pass = view.findViewById(R.id.passwordInput);
            String emailStr = email.getText() == null ? "" : email.getText().toString().trim();
            if (emailStr.isEmpty()) {
                email.setError("Email required");
                return;
            }
            // Demo: any credentials work. Field responder if email contains "field", else district admin.
            RoleManager.Role role = emailStr.contains("field") || emailStr.contains("responder")
                    ? RoleManager.Role.FIELD_RESPONDER : RoleManager.Role.DISTRICT_ADMIN;
            roleManager.setRole(role);
            roleManager.setUserId(emailStr);
            Toast.makeText(requireContext(), "Signed in as " + role.value, Toast.LENGTH_SHORT).show();
            Navigation.findNavController(view).navigate(
                    role == RoleManager.Role.FIELD_RESPONDER
                            ? R.id.fieldHomeFragment : R.id.govDashboardFragment);
        });

        govBtn.setOnClickListener(v -> Navigation.findNavController(v).navigate(R.id.govLoginFragment));
        otpBtn.setOnClickListener(v -> Navigation.findNavController(v).navigate(R.id.publicOtpFragment));
    }
}