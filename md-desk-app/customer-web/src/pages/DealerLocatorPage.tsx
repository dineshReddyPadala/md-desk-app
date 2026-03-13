import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, TextField, Paper, Grid, Card, CardContent, CardMedia, Skeleton } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import { dealersApi } from '../api/endpoints';

export default function DealerLocatorPage() {
  const [city, setCity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dealers', city],
    queryFn: async () => (await dealersApi.list(city || undefined)).data,
  });

  const dealers = (data?.dealers || []) as Array<{
    id: string;
    name: string;
    city?: string | null;
    phone?: string | null;
    imageUrl?: string | null;
    locationLat?: number | null;
    locationLong?: number | null;
  }>;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>Dealer Locator</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>Find dealers by city</Typography>
      <TextField
        fullWidth
        label="Filter by city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter city name"
        sx={{ mb: 3, maxWidth: 360 }}
      />
      {isLoading ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" width="70%" sx={{ mt: 1 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {dealers.map((d) => (
            <Grid item xs={12} sm={6} md={4} key={d.id}>
              <Card sx={{ height: '100%', borderRadius: 2 }} variant="outlined">
                {d.imageUrl ? (
                  <CardMedia component="img" height="140" image={d.imageUrl} alt={d.name} sx={{ objectFit: 'cover' }} />
                ) : (
                  <Box sx={{ height: 140, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                  </Box>
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom>{d.name}</Typography>
                  {d.city && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <LocationOnIcon fontSize="small" /> {d.city}
                    </Typography>
                  )}
                  {d.phone && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon fontSize="small" /> {d.phone}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {!isLoading && dealers.length === 0 && (
        <Typography color="text.secondary">No dealers found.</Typography>
      )}
    </Box>
  );
}
