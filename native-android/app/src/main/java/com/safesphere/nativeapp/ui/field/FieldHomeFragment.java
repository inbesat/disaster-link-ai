package com.safesphere.nativeapp.ui.field;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.navigation.Navigation;

import com.google.android.material.card.MaterialCardView;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.base.BaseFragment;

public class FieldHomeFragment extends BaseFragment {

    @Override protected int getLayoutRes() { return R.layout.fragment_field_home; }

    @Override protected void initViews(View view) {
        MaterialCardView shelterCard = view.findViewById(R.id.shelterUpdateCard);
        MaterialCardView requestCard = view.findViewById(R.id.requestResourcesCard);
        MaterialCardView mapCard = view.findViewById(R.id.fieldMapCard);

        shelterCard.setOnClickListener(v -> Navigation.findNavController(v).navigate(R.id.action_fieldHome_to_shelterUpdate));
        requestCard.setOnClickListener(v -> Navigation.findNavController(v).navigate(R.id.action_fieldHome_to_requestResources));
        mapCard.setOnClickListener(v -> Navigation.findNavController(v).navigate(R.id.action_fieldHome_to_fieldMap));
    }
}