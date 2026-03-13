import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Skeleton, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import { productsApi } from '../api/endpoints';

export default function ProductsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await productsApi.list()).data,
  });

  const allProducts = (data?.products || []) as Array<{ id: string; name: string; description?: string | null; imageUrl?: string | null }>;
  const products = useMemo(() => {
    if (!search.trim()) return allProducts;
    const q = search.trim().toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }, [allProducts, search]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>Products</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>Browse our product range</Typography>
      <TextField
        fullWidth
        placeholder="Search by name or description…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, maxWidth: 400 }}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />
      {isLoading ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" width="80%" sx={{ mt: 1 }} />
              <Skeleton variant="text" width="60%" />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {products.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Card sx={{ height: '100%', borderRadius: 2 }} variant="outlined">
                {p.imageUrl ? (
                  <CardMedia component="img" height="160" image={p.imageUrl} alt={p.name} sx={{ objectFit: 'cover' }} />
                ) : (
                  <Box sx={{ height: 160, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                  </Box>
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom>{p.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{p.description || '—'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {!isLoading && products.length === 0 && (
        <Typography color="text.secondary">{search.trim() ? 'No products match your search.' : 'No products available.'}</Typography>
      )}
    </Box>
  );
}
