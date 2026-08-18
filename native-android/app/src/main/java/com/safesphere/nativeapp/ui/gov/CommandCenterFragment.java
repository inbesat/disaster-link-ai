package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.lifecycle.Lifecycle;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.base.BaseFragment;

public class CommandCenterFragment extends BaseFragment {

    private ViewPager2 viewPager;
    private TabLayout tabLayout;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_command_center;
    }

    @Override
    protected void initViews(View view) {
        viewPager = view.findViewById(R.id.ccViewPager);
        tabLayout = view.findViewById(R.id.ccTabs);

        viewPager.setAdapter(new CommandCenterPagerAdapter(requireActivity()));
        new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
            String[] titles = {"Overview", "Live Feed", "Resources", "Shelters", "Timeline", "Analytics"};
            tab.setText(titles[position]);
        }).attach();
    }

    static class CommandCenterPagerAdapter extends FragmentStateAdapter {
        CommandCenterPagerAdapter(@NonNull FragmentActivity fa) { super(fa); }
        @NonNull @Override public Fragment createFragment(int position) {
            switch (position) {
                case 0: return new CCOverviewFragment();
                case 1: return new CCLiveFeedFragment();
                case 2: return new CCResourcesFragment();
                case 3: return new CCSheltersFragment();
                case 4: return new CCTimelineFragment();
                case 5: return new CCAnalyticsFragment();
                default: return new CCOverviewFragment();
            }
        }
        @Override public int getItemCount() { return 6; }
    }

    // Sub-fragments for each tab
    static class CCOverviewFragment extends Fragment {
        @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
            return inf.inflate(R.layout.fragment_cc_overview, c, false);
        }
    }
    static class CCLiveFeedFragment extends Fragment {
        @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
            return inf.inflate(R.layout.fragment_cc_live_feed, c, false);
        }
    }
    static class CCResourcesFragment extends Fragment {
        @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
            return inf.inflate(R.layout.fragment_cc_resources, c, false);
        }
    }
    static class CCSheltersFragment extends Fragment {
        @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
            return inf.inflate(R.layout.fragment_cc_shelters, c, false);
        }
    }
    static class CCTimelineFragment extends Fragment {
        @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
            return inf.inflate(R.layout.fragment_cc_timeline, c, false);
        }
    }
    static class CCAnalyticsFragment extends Fragment {
        @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
            return inf.inflate(R.layout.fragment_cc_analytics, c, false);
        }
    }
}