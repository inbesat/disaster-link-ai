package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Spinner;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.KnowledgeDocEntity;
import com.safesphere.nativeapp.data.repository.KnowledgeDocRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.List;
import android.widget.TextView;

public class KnowledgeBaseFragment extends BaseFragment {

    private KnowledgeDocRepository kbRepository;
    private RecyclerView kbRecyclerView;
    private Spinner districtSpinner, typeSpinner;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_knowledge_base;
    }

    @Override
    protected void initViews(View view) {
        kbRepository = new KnowledgeDocRepository(requireActivity().getApplication());
        kbRecyclerView = view.findViewById(R.id.kbRecyclerView);
        districtSpinner = view.findViewById(R.id.kbDistrictSpinner);
        typeSpinner = view.findViewById(R.id.kbTypeSpinner);

        kbRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        loadDocs();

        setupSpinners();
    }

    private void loadDocs() {
        kbRepository.getAllKnowledgeDocs().observe(getViewLifecycleOwner(), docs -> {
            if (docs != null) {
                kbRecyclerView.setAdapter(new DocAdapter(new ArrayList<>(docs)));
            }
        });
    }

    private void setupSpinners() {
        String[] districts = {"All", "Patna", "Ernakulam", "Kamrup", "Kochi", "Guwahati"};
        String[] types = {"All", "Evacuation Protocol", "DDMP", "Medical Triaging", "Shelter Management", "Resource Allocation", "Communication & Alerts", "Other"};
        districtSpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, districts));
        typeSpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, types));
    }

    static class DocAdapter extends RecyclerView.Adapter<DocAdapter.VH> {
        List<KnowledgeDocEntity> items = new ArrayList<>();
        DocAdapter(List<KnowledgeDocEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_kb_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            KnowledgeDocEntity d = items.get(pos);
            h.title.setText(d.title);
            h.district.setText(d.district);
            h.type.setText(d.documentType);
            h.embeddingStatus.setText(d.embedding != null && !d.embedding.isEmpty() ? "✓ Embedded" : "⏳ Pending");
            h.embeddingStatus.setTextColor(h.itemView.getContext().getColor(d.embedding != null && !d.embedding.isEmpty() ? R.color.colorSuccess : R.color.colorWarning));
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView title, district, type, embeddingStatus; VH(View v) { super(v); title = v.findViewById(R.id.docTitle); district = v.findViewById(R.id.docDistrict); type = v.findViewById(R.id.docType); embeddingStatus = v.findViewById(R.id.docEmbeddingStatus); } }
    }
}