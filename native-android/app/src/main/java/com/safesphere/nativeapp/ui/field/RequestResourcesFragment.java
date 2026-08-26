package com.safesphere.nativeapp.ui.field;

import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.Toast;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.base.BaseFragment;

public class RequestResourcesFragment extends BaseFragment {

    @Override protected int getLayoutRes() { return R.layout.fragment_request_resources; }

    @Override protected void initViews(View view) {
        String[] types = {"Personnel", "Vehicle", "Supplies", "Medical", "Communication"};
        AutoCompleteTextView typeSpinner = view.findViewById(R.id.requestTypeSpinner);
        typeSpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_dropdown_item_1line, types));

        String[] priorities = {"Critical", "High", "Medium", "Low"};
        AutoCompleteTextView prioritySpinner = view.findViewById(R.id.prioritySpinner);
        prioritySpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_dropdown_item_1line, priorities));

        Button submitBtn = view.findViewById(R.id.submitRequestBtn);
        submitBtn.setOnClickListener(v -> {
            Toast.makeText(requireContext(), "Resource request submitted", Toast.LENGTH_SHORT).show();
            requireActivity().onBackPressed();
        });
    }
}