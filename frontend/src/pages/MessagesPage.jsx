import { Box, Container } from '@mui/material';
import Messages from '../components/Messages';

function MessagesPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Messages />
      </Box>
    </Container>
  );
}

export default MessagesPage;