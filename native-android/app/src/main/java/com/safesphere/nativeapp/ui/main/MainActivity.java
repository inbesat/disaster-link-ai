package com.safesphere.nativeapp.ui.main;

import android.os.Bundle;
import android.view.MenuItem;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.navigation.NavController;
import androidx.navigation.NavDestination;
import androidx.navigation.fragment.NavHostFragment;
import androidx.navigation.ui.AppBarConfiguration;
import androidx.navigation.ui.NavigationUI;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.map.OfflineMapManager;
import com.safesphere.nativeapp.util.ConnectivityMonitor;
import com.safesphere.nativeapp.util.RoleManager;

public class MainActivity extends AppCompatActivity {

    private NavController navController;
    private AppBarConfiguration appBarConfiguration;
    private BottomNavigationView bottomNav;
    private RoleManager roleManager;
    private ConnectivityMonitor connectivityMonitor;
    private boolean isOfflineSnackbarShowing = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        roleManager = new RoleManager(this);
        connectivityMonitor = ConnectivityMonitor.getInstance(this);

        setupNavigation();
        setupConnectivityListener();
        checkInitialAuth();
    }

    private void setupNavigation() {
        NavHostFragment navHostFragment = (NavHostFragment) getSupportFragmentManager()
                .findFragmentById(R.id.nav_host_fragment);
        navController = navHostFragment.getNavController();

        bottomNav = findViewById(R.id.bottom_nav);
        NavigationUI.setupWithNavController(bottomNav, navController);

        // Configure app bar
        appBarConfiguration = new AppBarConfiguration.Builder(
                R.id.dashboardFragment,
                R.id.govDashboardFragment,
                R.id.adminDashboardFragment,
                R.id.fieldHomeFragment
        ).build();

        NavigationUI.setupActionBarWithNavController(this, navController, appBarConfiguration);

        // Listen for destination changes to update bottom nav visibility
        navController.addOnDestinationChangedListener((controller, destination, arguments) -> {
            updateBottomNavVisibility(destination.getId());
            updateToolbarTitle(destination);
        });
    }

    private void updateBottomNavVisibility(int destinationId) {
        // Show bottom nav for main destinations, hide for auth/detail screens
        boolean showBottomNav = destinationId == R.id.dashboardFragment
                || destinationId == R.id.alertsFragment
                || destinationId == R.id.mapFragment
                || destinationId == R.id.sosFragment
                || destinationId == R.id.govDashboardFragment
                || destinationId == R.id.commandCenterFragment
                || destinationId == R.id.adminDashboardFragment
                || destinationId == R.id.fieldHomeFragment
                || destinationId == R.id.settingsFragment;

        bottomNav.setVisibility(showBottomNav ? android.view.View.VISIBLE : android.view.View.GONE);
    }

    private void updateToolbarTitle(NavDestination destination) {
        // Update toolbar subtitle based on role and destination
        RoleManager.Role role = roleManager.getRole();
        String subtitle = "";

        switch (role) {
            case SUPER_ADMIN:
            case DISTRICT_ADMIN:
                subtitle = "District Admin";
                break;
            case FIELD_RESPONDER:
                subtitle = "Field Responder";
                break;
            case PUBLIC:
                subtitle = "Citizen Portal";
                break;
            case GUEST:
                subtitle = "Guest Mode";
                break;
            default:
                subtitle = "";
        }

        androidx.appcompat.widget.Toolbar toolbar = findViewById(R.id.toolbar);
        if (toolbar != null) {
            toolbar.setSubtitle(subtitle);
        }
    }

    private void setupConnectivityListener() {
        connectivityMonitor.setListener(isOnline -> {
            runOnUiThread(() -> {
                if (isOnline) {
                    hideOfflineBanner();
                } else {
                    showOfflineBanner();
                }
            });
        });
    }

    private void checkInitialAuth() {
        RoleManager.Role role = roleManager.getRole();
        if (role == RoleManager.Role.NONE) {
            // No role set - go to login
            navController.navigate(R.id.loginFragment);
        } else {
            // Route to appropriate dashboard based on role
            navigateToRoleDashboard(role);
        }
    }

    private void navigateToRoleDashboard(RoleManager.Role role) {
        int destinationId;
        switch (role) {
            case SUPER_ADMIN:
            case DISTRICT_ADMIN:
                destinationId = R.id.govDashboardFragment;
                break;
            case FIELD_RESPONDER:
                destinationId = R.id.fieldHomeFragment;
                break;
            case PUBLIC:
                destinationId = R.id.dashboardFragment;
                break;
            case GUEST:
                // Check if guest is public or field
                if (roleManager.isGuestMode()) {
                    destinationId = R.id.dashboardFragment; // Default to citizen view
                } else {
                    destinationId = R.id.fieldHomeFragment;
                }
                break;
            default:
                destinationId = R.id.dashboardFragment;
        }
        navController.navigate(destinationId);
    }

    private void showOfflineBanner() {
        if (!isOfflineSnackbarShowing) {
            com.google.android.material.snackbar.Snackbar.make(
                    findViewById(R.id.main_coordinator),
                    R.string.offline_banner,
                    com.google.android.material.snackbar.Snackbar.LENGTH_INDEFINITE
            )
                    .setBackgroundTint(getColor(R.color.colorWarning))
                    .setTextColor(getColor(android.R.color.white))
                    .setAction(R.string.retry, v -> connectivityMonitor.checkConnectivity())
                    .show();
            isOfflineSnackbarShowing = true;
        }
    }

    private void hideOfflineBanner() {
        if (isOfflineSnackbarShowing) {
            com.google.android.material.snackbar.Snackbar.make(
                    findViewById(R.id.main_coordinator),
                    R.string.online_restored,
                    com.google.android.material.snackbar.Snackbar.LENGTH_SHORT
            )
                    .setBackgroundTint(getColor(R.color.colorSuccess))
                    .show();
            isOfflineSnackbarShowing = false;
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        OfflineMapManager.getInstance().onForeground(this);
    }

    @Override
    protected void onStop() {
        super.onStop();
        OfflineMapManager.getInstance().onBackground();
    }

    @Override
    public boolean onSupportNavigateUp() {
        return navController.navigateUp() || super.onSupportNavigateUp();
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (NavigationUI.onNavDestinationSelected(item, navController)) {
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}