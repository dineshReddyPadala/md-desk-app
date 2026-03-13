import { Link } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import MessageIcon from '@mui/icons-material/Message';

export default function DashboardPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>Dashboard</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <ReportProblemIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>Raise a Complaint</Typography>
              <Typography variant="body2" color="textSecondary">Submit a new complaint with photos</Typography>
              <Button component={Link} to="/raise-complaint" variant="contained" sx={{ mt: 2 }}>Raise Complaint</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <TrackChangesIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>Track Complaint</Typography>
              <Typography variant="body2" color="textSecondary">Check status with your complaint ID</Typography>
              <Button component={Link} to="/track" variant="contained" sx={{ mt: 2 }}>Track</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <MessageIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>Message MD</Typography>
              <Typography variant="body2" color="textSecondary">Send suggestions or feedback</Typography>
              <Button component={Link} to="/message-md" variant="contained" sx={{ mt: 2 }}>Message</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
