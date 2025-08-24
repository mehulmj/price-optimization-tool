import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, AppBar, Box, Button, Card, CardContent, Checkbox, Container, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, IconButton, MenuItem, Paper, Snackbar,
  Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, 
  TablePagination, TableRow, TextField, Toolbar, Typography, Chip, LinearProgress
} from "@mui/material";
import {
  ArrowBack, FilterList, ShowChart, Visibility, Edit, Delete, Close,
  Inventory, Search
} from "@mui/icons-material";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// Import your real API functions
import { listProducts, createProduct, updateProduct, deleteProduct } from "../api/products";
import { CircularProgress } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { getForecastChartData, generateForecasts } from "../api/forecast";
import { useAuth } from "../auth/AuthContext";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Simple Product Detail Dialog - Only spec requirements
function ProductDetailDialog({ open, onClose, product }) {
  if (!product) return null;

  const formatCurrency = (amount) => `$ ${Number(amount).toFixed(2)}`;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Product Details
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Product Name */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Product Name</Typography>
            <Typography variant="h6" fontWeight="bold">{product.name}</Typography>
          </Box>

          {/* Category */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Category</Typography>
            <Chip label={product.category} size="small" />
          </Box>

          {/* Description */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography variant="body1">{product.description || "No description available"}</Typography>
          </Box>

          {/* Cost Price */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Cost Price</Typography>
            <Typography variant="body1" fontWeight="medium">{formatCurrency(product.base_price)}</Typography>
          </Box>

          {/* Selling Price */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Selling Price</Typography>
            <Typography variant="body1" fontWeight="medium">{formatCurrency(product.current_price)}</Typography>
          </Box>

          {/* Stock Available */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Stock Available</Typography>
            <Typography variant="body1">{product.stock_qty?.toLocaleString()}</Typography>
          </Box>

          {/* Units Sold */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Units Sold Till Date</Typography>
            <Typography variant="body1">{product.units_sold?.toLocaleString()}</Typography>
          </Box>

          {/* Customer Rating (from spec) */}
          {product.customer_rating && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Customer Rating</Typography>
              <Typography variant="body1">{product.customer_rating}/5 ⭐</Typography>
            </Box>
          )}

          {/* Demand Forecast (from spec) */}
          {product.demand_forecast && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Demand Forecast</Typography>
              <Typography variant="body1">{product.demand_forecast?.toLocaleString()}</Typography>
            </Box>
          )}

          {/* Optimized Price (from spec) */}
          {product.optimized_price && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Optimized Price</Typography>
              <Typography variant="body1" fontWeight="medium" color="success.main">
                {formatCurrency(product.optimized_price)}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// Enhanced Product Form Dialog
function ProductFormDialog({ open, onClose, initial, onSaved }) {
  const isEdit = Boolean(initial?.id);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "electronics", base_price: "", current_price: "",
    description: "", stock_qty: "", units_sold: "", min_price: "", max_price: ""
  });

  useEffect(() => {
    if (!open) return;
    setForm(isEdit ? {
      name: initial?.name ?? "",
      category: initial?.category ?? "electronics",
      base_price: String(initial?.base_price ?? ""),
      current_price: String(initial?.current_price ?? ""),
      description: initial?.description ?? "",
      stock_qty: String(initial?.stock_qty ?? ""),
      units_sold: String(initial?.units_sold ?? ""),
      min_price: String(initial?.min_price ?? ""),
      max_price: String(initial?.max_price ?? "")
    } : { 
      name: "", category: "electronics", base_price: "", current_price: "", 
      description: "", stock_qty: "", units_sold: "", min_price: "", max_price: ""
    });
  }, [open, isEdit, initial]);

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    const payload = {
      name: form.name.trim(),
      category: form.category,
      base_price: Number(form.base_price || 0),
      current_price: Number(form.current_price || form.base_price || 0),
      description: form.description || "",
      stock_qty: Number(form.stock_qty || 0),
      units_sold: Number(form.units_sold || 0),
      min_price: Number(form.min_price || form.base_price || 0),
      max_price: Number(form.max_price || form.current_price || 0)
    };
    
    setBusy(true);
    try {
      if (isEdit) {
        await updateProduct(initial.id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved && onSaved();
      onClose();
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEdit ? "Edit Product" : "Add New Product"}
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth label="Product Name" 
              value={form.name} 
              onChange={handleChange("name")}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth label="Product Category" 
              select 
              value={form.category} 
              onChange={handleChange("category")}
            >
              {CATEGORIES.filter(c => c.value !== "").map(c =>
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth label="Cost Price" 
              type="number"
              value={form.base_price} 
              onChange={handleChange("base_price")}
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth label="Selling Price" 
              type="number"
              value={form.current_price} 
              onChange={handleChange("current_price")}
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth label="Available Stock" 
              type="number"
              value={form.stock_qty} 
              onChange={handleChange("stock_qty")}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth label="Min Price" 
              type="number"
              value={form.min_price} 
              onChange={handleChange("min_price")}
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth label="Max Price" 
              type="number"
              value={form.max_price} 
              onChange={handleChange("max_price")}
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth label="Description" 
              multiline 
              rows={3}
              value={form.description} 
              onChange={handleChange("description")}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth label="Units Sold" 
              type="number"
              value={form.units_sold} 
              onChange={handleChange("units_sold")}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy} onClick={handleSubmit}>
          {busy ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


function DemandForecastDialog({ open, onClose, products }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Fetch forecast data when dialog opens
  useEffect(() => {
    if (open && products.length > 0) {
      fetchForecastData();
    }
  }, [open, products]);

  const fetchForecastData = async () => {
    setLoading(true);
    try {
      // Get first 4 products for chart
      const productIds = products.slice(0, 4).map(p => p.id);
      const data = await getForecastChartData(productIds);
      setChartData(data.historical_data || []);
    } catch (error) {
      console.error("Failed to fetch forecast data:", error);
      // Fallback to client-side generation if API fails
      generateClientSideForecast();
    } finally {
      setLoading(false);
    }
  };

  // Generate new forecasts via API
  const handleGenerateForecasts = async () => {
    setGenerating(true);
    try {
      const productIds = products.slice(0, 4).map(p => p.id);
      await generateForecasts({
        product_ids: productIds,
        method: "historical_simulation",
        years: 5
      });
      
      // Refresh chart data after generation
      await fetchForecastData();
      
      // Show success message
      // You can add a toast notification here
    } catch (error) {
      console.error("Failed to generate forecasts:", error);
    } finally {
      setGenerating(false);
    }
  };

  // Fallback client-side forecast generation
  const generateClientSideForecast = () => {
    const years = [2020, 2021, 2022, 2023, 2024];
    const data = years.map(year => {
      const yearData = { year };
      
      products.slice(0, 4).forEach((product, index) => {
        const baseDemand = product.demand_forecast || (product.units_sold * 0.018) || 100;
        
        // Different growth patterns
        let yearMultiplier = 1;
        switch (index % 4) {
          case 0: // Growing trend
            yearMultiplier = 0.7 + (year - 2020) * 0.08;
            break;
          case 1: // Declining trend  
            yearMultiplier = 1.3 - (year - 2020) * 0.08;
            break;
          case 2: // Seasonal/volatile
            yearMultiplier = 1 + 0.3 * Math.sin((year - 2020) * Math.PI / 2);
            break;
          case 3: // Steady growth
            yearMultiplier = 0.9 + (year - 2020) * 0.03;
            break;
        }
        
        yearData[product.name] = Math.round(baseDemand * yearMultiplier);
      });
      
      return yearData;
    });
    
    setChartData(data);
  };

  const formatCurrency = (amount) => `$ ${Number(amount).toFixed(1)}`;
  const calculateDemandForecast = (product) => {
    return product.demand_forecast || Math.round(product.units_sold * 0.018) || 0;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Demand Forecast Analysis
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleGenerateForecasts}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={16} /> : <Refresh />}
          >
            {generating ? "Generating..." : "Generate New Forecasts"}
          </Button>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Historical Demand Trends (2020-2024)
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: 400, mb: 4 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                {products.slice(0, 4).map((product, index) => (
                  <Line 
                    key={product.id}
                    type="monotone" 
                    dataKey={product.name} 
                    stroke={COLORS[index]} 
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
        
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Current Product Demand Summary
        </Typography>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Cost Price</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell>Available Stock</TableCell>
                <TableCell>Units Sold</TableCell>
                <TableCell>Demand Forecast</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.slice(0, 10).map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <Chip label={product.category} size="small" />
                  </TableCell>
                  <TableCell>{formatCurrency(product.base_price)}</TableCell>
                  <TableCell>{formatCurrency(product.current_price)}</TableCell>
                  <TableCell>{product.stock_qty?.toLocaleString()}</TableCell>
                  <TableCell>{product.units_sold?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography color="primary" fontWeight="bold">
                      {calculateDemandForecast(product).toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {chartData.length === 0 && !loading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No forecast data available. Click "Generate New Forecasts" to create demand projections.
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
// Main Product Management Component
export default function ProductsPage() {
  const user = useAuth() || {};
  const role = user.user.role;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Pagination states
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Form and dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [forecastOpen, setForecastOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  
  // Filter states - these are the actual filters that get sent to API
  const [activeFilters, setActiveFilters] = useState({
    search: "",
    category: ""
  });
  
  // UI filter states - these are what the user sees/types
  const [searchInput, setSearchInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [withDemandForecast, setWithDemandForecast] = useState(true);
  
  // Toast
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setActiveFilters(prev => ({
        ...prev,
        search: searchInput.trim()
      }));
    }, 500); // 500ms debounce for search

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Immediate category filter update
  useEffect(() => {
    setActiveFilters(prev => ({
      ...prev,
      category: categoryInput
    }));
  }, [categoryInput]);

  // Debug effect to see categories
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = [...new Set(products.map(p => p.category))];
      console.log("🔍 Unique categories in your data:", uniqueCategories);
      
      const categoryCount = {};
      products.forEach(p => {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
      });
      console.log("🔍 Products per category:", categoryCount);
    }
  }, [products]);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1, // API expects 1-based pagination
        page_size: rowsPerPage,
      };

      // Only add non-empty filters to params
      if (activeFilters.search) {
        params.search = activeFilters.search;
      }
      if (activeFilters.category) {
        params.category = activeFilters.category;
      }
      
      console.log("🔍 API Request params:", params); // Debug log
      
      const response = await listProducts(params);
      console.log("🔍 API Response:", response);
      
      // Handle both paginated and non-paginated responses
      if (response.data?.results) {
        // Paginated response from Django
        setProducts(response.data.results);
        setTotalCount(response.data.count || 0);
      } else if (Array.isArray(response.data)) {
        // Non-paginated response - apply client-side filtering
        let filteredData = response.data;
        
        // Client-side search filter
        if (activeFilters.search) {
          const searchLower = activeFilters.search.toLowerCase();
          filteredData = filteredData.filter(product => 
            product.name?.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower)
          );
        }
        
        // Client-side category filter
        if (activeFilters.category) {
          console.log("🔍 Filtering by category:", activeFilters.category);
          console.log("🔍 Available products:", filteredData.map(p => ({ name: p.name, category: p.category })));
          
          filteredData = filteredData.filter(product => {
            const productCategory = product.category?.toLowerCase();
            const filterCategory = activeFilters.category.toLowerCase();
            const matches = productCategory === filterCategory;
            
            if (!matches) {
              console.log(`🔍 Product "${product.name}" category "${productCategory}" doesn't match filter "${filterCategory}"`);
            }
            
            return matches;
          });
          
          console.log("🔍 Filtered products:", filteredData.map(p => p.name));
        }
        
        setProducts(filteredData);
        setTotalCount(filteredData.length);
      } else {
        setProducts([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
      setToast({ open: true, message: "Failed to load products", severity: "error" });
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, activeFilters]);

  // Load products when active filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [activeFilters]);

  // Calculate demand forecast
  const calculateDemandForecast = (product) => {
    return product.demand_forecast || Math.round(product.units_sold * 0.018) || 0;
  };

  // Handle product selection
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  // CRUD operations
  const handleCreateProduct = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditing(product);
    setFormOpen(true);
  };

  const handleViewProduct = (product) => {
    setViewingProduct(product);
    setViewOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteProduct(productId);
      setToast({ open: true, message: "Product deleted successfully", severity: "success" });
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error("Delete failed:", error);
      setToast({ open: true, message: "Error deleting product", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = () => {
    setToast({ 
      open: true, 
      message: editing ? "Product updated successfully" : "Product created successfully", 
      severity: "success" 
    });
    fetchProducts(); // Refresh the list
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchInput("");
    setCategoryInput("");
    setActiveFilters({ search: "", category: "" });
  };

  // Apply filters manually (for the Filter button)
  const handleApplyFilters = () => {
    setActiveFilters({
      search: searchInput.trim(),
      category: categoryInput
    });
  };
  
  // Format currency
  const formatCurrency = (amount) => `$ ${Number(amount).toFixed(1)}`;

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* App Header */}
      <AppBar position="static" elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Toolbar>
          <Inventory sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Product Management
          </Typography>
          <Typography variant="body2">
            {totalCount} products found
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Header Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Button 
              startIcon={<ArrowBack />} 
              onClick={() => window.history.back()}
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>
            
            <Typography variant="h6" fontWeight="bold">
              Create and Manage Product
            </Typography>
            
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">With Demand Forecast</Typography>
              <Switch 
                checked={withDemandForecast} 
                onChange={(e) => setWithDemandForecast(e.target.checked)}
              />
            </Stack>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <TextField
              size="small"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            
            <TextField
              size="small"
              select
              label="Category"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              {CATEGORIES.map(cat => (
                <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
              ))}
            </TextField>
            
            <Button 
              variant="outlined" 
              startIcon={<FilterList />}
              sx={{ textTransform: 'none' }}
              onClick={handleApplyFilters}
            >
              Apply
            </Button>

            <Button 
              variant="text" 
              size="small"
              onClick={handleClearFilters}
              sx={{ textTransform: 'none' }}
            >
              Clear
            </Button>
            { role != 'buyer' &&
            <Button 
              variant="contained" 
              onClick={handleCreateProduct}
              sx={{ textTransform: 'none' }}
            >
              Add New Product
            </Button>
            }
            <Button 
              variant="contained" 
              color="success"
              startIcon={<ShowChart />}
              onClick={() => setForecastOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Demand Forecast
            </Button>
          </Stack>

          {/* Active Filters Display */}
          {(activeFilters.search || activeFilters.category) && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Active Filters:
              </Typography>
              <Stack direction="row" spacing={1}>
                {activeFilters.search && (
                  <Chip 
                    label={`Search: "${activeFilters.search}"`} 
                    size="small" 
                    onDelete={() => {
                      setSearchInput("");
                      setActiveFilters(prev => ({ ...prev, search: "" }));
                    }}
                  />
                )}
                {activeFilters.category && (
                  <Chip 
                    label={`Category: ${CATEGORIES.find(c => c.value === activeFilters.category)?.label || activeFilters.category}`}
                    size="small" 
                    onDelete={() => {
                      setCategoryInput("");
                      setActiveFilters(prev => ({ ...prev, category: "" }));
                    }}
                  />
                )}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Products Table */}
      <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                bgcolor: 'grey.800',
                '& .MuiTableCell-head': {
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.875rem'
                }
              }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                    checked={products.length > 0 && selectedProducts.length === products.length}
                    onChange={handleSelectAll}
                    sx={{ color: 'white' }}
                  />
                </TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Product Category</TableCell>
                <TableCell>Cost Price</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Available Stock</TableCell>
                <TableCell>Units Sold</TableCell>
                {withDemandForecast && <TableCell>Calculated Demand</TableCell>}
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{product.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" />
                    </TableCell>
                    <TableCell>{formatCurrency(product.base_price)}</TableCell>
                    <TableCell>{formatCurrency(product.current_price)}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap>
                        {product.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{product.stock_qty?.toLocaleString()}</TableCell>
                    <TableCell>{product.units_sold?.toLocaleString()}</TableCell>
                    {withDemandForecast && (
                      <TableCell>
                        <Typography color="primary" fontWeight="bold">
                          {calculateDemandForecast(product).toLocaleString()}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        title="View Details"
                        onClick={() => handleViewProduct(product)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      {user.user.username == product.owner_username &&
                      <IconButton 
                        size="small" 
                        title="Edit" 
                        onClick={() => handleEditProduct(product)}
                      > 
                        <Edit fontSize="small" />
                      </IconButton> }
                      {user.user.username == product.owner_username &&
                      <IconButton 
                        size="small" 
                        color="error" 
                        title="Delete"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton> }
                      
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    {loading ? "Loading..." : 
                     (activeFilters.search || activeFilters.category) ? 
                     "No products match your filters" : 
                     "No products found"
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Dialogs */}
      {role != 'buyer' &&
      <ProductFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSaved={handleSaveProduct}
      />
        }
      {/* Product Detail Dialog */}
      <ProductDetailDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        product={viewingProduct}
      />
      {/* demand forecast dialog */}
      <DemandForecastDialog
        open={forecastOpen}
        onClose={() => setForecastOpen(false)}
        products={products}
        />

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} onClose={() => setToast(prev => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}