import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  Close as CloseIcon,
  SportsEsports as GameIcon
} from '@mui/icons-material';
import apiService from '../services/apiService';

export default function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameDetailsOpen, setGameDetailsOpen] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const [userData, userGames] = await Promise.all([
        apiService.getUser(userId),
        apiService.getUserGames(userId)
      ]);

      setUser(userData);
      setGames(userGames);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameClick = async (game) => {
    try {
      const fullGame = await apiService.getGame(game.id);
      setSelectedGame(fullGame);
      setGameDetailsOpen(true);
    } catch (error) {
      console.error('Failed to load game details:', error);
    }
  };

  const handleCloseDetails = () => {
    setGameDetailsOpen(false);
    setSelectedGame(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box textAlign="center" py={6}>
        <Typography variant="h6" color="text.secondary">
          User not found
        </Typography>
      </Box>
    );
  }

  const winRate = user.gamesPlayed > 0 
    ? ((user.wins / user.gamesPlayed) * 100).toFixed(1) 
    : 0;

  const completedGames = games.filter(g => g.status === 2);

  return (
    <Box maxWidth="900px" margin="0 auto" p={3}>
      {/* User Stats Card */}
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <TrophyIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" component="h1">
              {user.username}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {user.elo}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rating
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold">
                  {user.gamesPlayed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Games
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {user.wins}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Wins
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" color="error.main" fontWeight="bold">
                  {user.losses}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Losses
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" color="warning.main" fontWeight="bold">
                  {user.draws}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Draws
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold">
                  {winRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Win Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Games History */}
      <Card elevation={3}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <GameIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h5" component="h2">
              Game History
            </Typography>
          </Box>

          {completedGames.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No completed games yet
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {completedGames.map((game, index) => {
                const isWhite = game.whitePlayerId === userId;
                const opponent = isWhite ? game.blackPlayer : game.whitePlayer;
                
                let resultText = 'Draw';
                let resultColor = 'warning';
                
                if (game.winnerId === userId) {
                  resultText = 'Win';
                  resultColor = 'success';
                } else if (game.winnerId !== null) {
                  resultText = 'Loss';
                  resultColor = 'error';
                }

                const gameDate = new Date(game.completedAt || game.createdAt);
                const dateStr = gameDate.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <Box key={game.id}>
                    {index > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => handleGameClick(game)}>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="500">
                                vs {opponent?.username || 'Unknown'}
                              </Typography>
                              <Chip 
                                label={resultText} 
                                color={resultColor}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box display="flex" gap={2} mt={0.5}>
                              <Typography variant="body2" color="text.secondary">
                                {isWhite ? '⚪ White' : '⚫ Black'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {game.timeControl}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {dateStr}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  </Box>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Game Details Dialog */}
      <Dialog 
        open={gameDetailsOpen} 
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Game Details</Typography>
            <IconButton onClick={handleCloseDetails} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedGame && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    White
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {selectedGame.whitePlayer?.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedGame.whitePlayer?.elo} rating
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Black
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {selectedGame.blackPlayer?.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedGame.blackPlayer?.elo} rating
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Result
                </Typography>
                <Typography variant="body1">
                  {selectedGame.result === 0 && '1-0 (White wins)'}
                  {selectedGame.result === 1 && '0-1 (Black wins)'}
                  {selectedGame.result === 2 && '½-½ (Draw)'}
                  {selectedGame.result === 3 && '½-½ (Stalemate)'}
                  {selectedGame.result === 4 && 'Timeout'}
                  {selectedGame.result === 5 && 'Resignation'}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Time Control
                </Typography>
                <Typography variant="body1">
                  {selectedGame.timeControl}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Moves
                </Typography>
                <Typography variant="body1">
                  {selectedGame.moves?.length || 0} moves
                </Typography>
              </Box>

              {selectedGame.moves && selectedGame.moves.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Move History
                  </Typography>
                  <Box 
                    sx={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      bgcolor: 'grey.50',
                      p: 2,
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', m: 0 }}>
                      {selectedGame.moves
                        .reduce((acc, move, idx) => {
                          if (idx % 2 === 0) {
                            acc.push(`${Math.floor(idx / 2) + 1}. ${move.san}`);
                          } else {
                            acc[acc.length - 1] += ` ${move.san}`;
                          }
                          return acc;
                        }, [])
                        .join('\n')}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Game ID: {selectedGame.id}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
