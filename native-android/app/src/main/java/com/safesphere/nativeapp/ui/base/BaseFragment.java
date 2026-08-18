package com.safesphere.nativeapp.ui.base;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.LayoutRes;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.safesphere.nativeapp.util.RoleManager;

public abstract class BaseFragment extends Fragment {

    protected RoleManager roleManager;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (requireActivity() != null) {
            roleManager = new RoleManager(requireActivity());
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(getLayoutRes(), container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initViews(view);
        setupObservers();
        setupClickListeners();
    }

    @LayoutRes
    protected abstract int getLayoutRes();

    protected abstract void initViews(View view);

    protected void setupObservers() {}

    protected void setupClickListeners() {}

    protected <T extends androidx.lifecycle.ViewModel> T getViewModel(@NonNull Class<T> modelClass) {
        return new ViewModelProvider(this).get(modelClass);
    }

    protected <T extends androidx.lifecycle.ViewModel> T getSharedViewModel(@NonNull Class<T> modelClass) {
        return new ViewModelProvider(requireActivity()).get(modelClass);
    }

    protected boolean hasGovAccess() {
        return roleManager != null && roleManager.isGovRole();
    }

    protected boolean hasAdminAccess() {
        return roleManager != null && roleManager.isAdminRole();
    }

    protected boolean isPublicRole() {
        return roleManager != null && roleManager.isPublicRole();
    }
}