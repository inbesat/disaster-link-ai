package com.safesphere.nativeapp.ui.field;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.google.android.material.textfield.TextInputEditText;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.base.BaseFragment;

public class ShelterUpdateFragment extends BaseFragment {

    @Override protected int getLayoutRes() { return R.layout.fragment_shelter_update; }

    @Override protected void initViews(View view) {
        Button submitBtn = view.findViewById(R.id.submitStatusBtn);
        submitBtn.setOnClickListener(v -> {
            TextInputEditText nameInput = view.findViewById(R.id.shelterNameInput);
            Toast.makeText(requireContext(), "Status updated for " + nameInput.getText().toString(), Toast.LENGTH_SHORT).show();
            requireActivity().onBackPressed();
        });
    }
}