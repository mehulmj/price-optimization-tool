import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, AppBar, Box, Button, Card, CardContent, Container, LinearProgress,
  MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, Toolbar, Typography, 
  Chip
} from "@mui/material";
import {
  ArrowBack, FilterList, PriceChange
} from "@mui/icons-material";

// Import your real API functions
import { listProducts } from "../api/products";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "stationery", label: "Stationery" },
  { value: "electronics", label: "Electronics" },
  { value: "grocery", label: "Grocery" },
  { value: "other", label: "Other" }
];

export default function PricingOptimizationPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState("");
  
  // Toast
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        category: categoryFilter || undefined
      };
      
      const response = await listProducts(params);
      
      // Handle both paginated and non-paginated responses
      if (response.data.results) {
        setProducts(response.data.results);
      } else if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setToast({ open: true, message: "Failed to load products", severity: "error" });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  // Load products on component mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Format currency
  const formatCurrency = (amount) => `$ ${Number(amount).toFixed(2)}`;

  // Helper function to determine price change indicator
  const getPriceChangeInfo = (current, optimized) => {
    const currentPrice = parseFloat(current);
    const optimizedPrice = parseFloat(optimized);
    const difference = optimizedPrice - currentPrice;
    const percentage = currentPrice > 0 ? (difference / currentPrice) * 100 : 0;

    return {
      difference,
      percentage,
      isIncrease: difference > 0.01,
      isDecrease: difference < -0.01,
      isOptimal: Math.abs(difference) <= 0.01
    };
  };

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* App Header */}
      <AppBar position="static" elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Toolbar>
          <PriceChange sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Pricing Optimization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {products.length} products analyzed
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Header Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button 
              startIcon={<ArrowBack />} 
              onClick={() => window.history.back()}
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>
            
            <Typography variant="h6" fontWeight="bold">
              Pricing Optimization
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Optimized prices from data analysis and business rules
            </Typography>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <TextField
              size="small"
              select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              {CATEGORIES.map(cat => (
                <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
              ))}
            </TextField>
            
            <Button 
              variant="outlined" 
              startIcon={<FilterList />}
              onClick={fetchProducts}
              sx={{ textTransform: 'none' }}
            >
              Filter
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Pricing Optimization Table - EXACTLY AS PER SPECIFICATION */}
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
                <TableCell>Product Name</TableCell>
                <TableCell>Product Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Cost Price</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell>Optimized Price</TableCell>
                <TableCell align="center">Price Change</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const priceInfo = getPriceChangeInfo(product.current_price, product.optimized_price);
                
                return (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{product.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap>
                        {product.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatCurrency(product.base_price)}</TableCell>
                    <TableCell>{formatCurrency(product.current_price)}</TableCell>
                    <TableCell>
                      <Typography 
                        color={
                          priceInfo.isIncrease ? "success.main" : 
                          priceInfo.isDecrease ? "warning.main" : 
                          "primary.main"
                        }
                        fontWeight="bold"
                      >
                        {formatCurrency(product.optimized_price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {priceInfo.isOptimal ? (
                        <Chip 
                          label="Optimal" 
                          size="small" 
                          color="default" 
                          variant="outlined"
                        />
                      ) : (
                        <Stack direction="column" alignItems="center" spacing={0.5}>
                          <Typography 
                            variant="body2" 
                            color={priceInfo.isIncrease ? "success.main" : "warning.main"}
                            fontWeight="medium"
                          >
                            {priceInfo.isIncrease ? "+" : ""}{formatCurrency(priceInfo.difference)}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                          >
                            ({priceInfo.isIncrease ? "+" : ""}{priceInfo.percentage.toFixed(1)}%)
                          </Typography>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    {loading ? "Loading products..." : "No products found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary Information */}
      {products.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Optimization Summary
            </Typography>
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Price Increases
                </Typography>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  {products.filter(p => {
                    const info = getPriceChangeInfo(p.current_price, p.optimized_price);
                    return info.isIncrease;
                  }).length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Price Decreases
                </Typography>
                <Typography variant="h6" color="warning.main" fontWeight="bold">
                  {products.filter(p => {
                    const info = getPriceChangeInfo(p.current_price, p.optimized_price);
                    return info.isDecrease;
                  }).length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Already Optimal
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {products.filter(p => {
                    const info = getPriceChangeInfo(p.current_price, p.optimized_price);
                    return info.isOptimal;
                  }).length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Products
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {products.length}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

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