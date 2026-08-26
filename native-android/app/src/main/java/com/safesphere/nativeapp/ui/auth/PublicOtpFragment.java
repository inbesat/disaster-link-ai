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

public class PublicOtpFragment extends BaseFragment {

    @Override protected int getLayoutRes() { return R.layout.fragment_public_otp; }

    @Override protected void initViews(View view) {
        Button sendBtn = view.findViewById(R.id.sendOtpBtn);
        Button verifyBtn = view.findViewById(R.id.verifyOtpBtn);
        Button backBtn = view.findViewById(R.id.backToLoginBtn);

        sendBtn.setOnClickListener(v -> {
            TextInputEditText phone = view.findViewById(R.id.phoneInput);
            String phoneStr = phone.getText() == null ? "" : phone.getText().toString().trim();
            if (phoneStr.length() < 10) {
                phone.setError("Valid phone number required");
                return;
            }
            Toast.makeText(requireContext(), "OTP sent to " + phoneStr + " (demo: any 6 digits)", Toast.LENGTH_SHORT).show();
        });

        verifyBtn.setOnClickListener(v -> {
            TextInputEditText otp = view.findViewById(R.id.otpInput);
            String otpStr = otp.getText() == null ? "" : otp.getText().toString().trim();
            if (otpStr.length() != 6) {
                otp.setError("Enter the 6-digit OTP");
                return;
            }
            roleManager.setRole(RoleManager.Role.PUBLIC);
            roleManager.setUserId("citizen_" + System.currentTimeMillis());
            roleManager.setGuestMode(false);
            Toast.makeText(requireContext(), "Welcome to SafeSphere", Toast.LENGTH_SHORT).show();
            Navigation.findNavController(view).navigate(R.id.dashboardFragment);
        });

        backBtn.setOnClickListener(v -> requireActivity().onBackPressed());
    }
}