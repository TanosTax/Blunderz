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
import { theme } from '../theme';

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
      <Card 
        elevation={0}
        sx={{ 
          mb: 4,
          bgcolor: theme.colors.surface,
          border: `1px solid ${theme.colors.borderGold}`,
          borderRadius: theme.borderRadius.large,
          boxShadow: theme.shadows.glow
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <TrophyIcon sx={{ fontSize: 40, color: theme.colors.accent, mr: 2 }} />
            <Typography variant="h4" component="h1" sx={{ color: theme.colors.textPrimary }}>
              {user.username}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" sx={{ color: theme.colors.accent, fontWeight: 'bold' }}>
                  {user.elo}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                  Rating
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" sx={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>
                  {user.gamesPlayed}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                  Games
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" sx={{ color: theme.colors.accent, fontWeight: 'bold' }}>
                  {user.wins}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                  Wins
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" sx={{ color: theme.colors.error, fontWeight: 'bold' }}>
                  {user.losses}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                  Losses
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" sx={{ color: theme.colors.warning, fontWeight: 'bold' }}>
                  {user.draws}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                  Draws
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box textAlign="center">
                <Typography variant="h3" sx={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>
                  {winRate}%
                </Typography>
                <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                  Win Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Games History */}
      <Card 
        elevation={0}
        sx={{ 
          bgcolor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.large
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <GameIcon sx={{ mr: 1, color: theme.colors.accent }} />
            <Typography variant="h5" component="h2" sx={{ color: theme.colors.textPrimary }}>
              Game History
            </Typography>
          </Box>

          {completedGames.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" sx={{ color: theme.colors.textSecondary }}>
                No completed games yet
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {completedGames.map((game, index) => {
                const isWhite = game.whitePlayerId === userId;
                const opponent = isWhite ? game.blackPlayer : game.whitePlayer;
                
                let resultText = 'Draw';
                let chipColor = theme.colors.warning;
                
                if (game.winnerId === userId) {
                  resultText = 'Win';
                  chipColor = theme.colors.accent;
                } else if (game.winnerId !== null) {
                  resultText = 'Loss';
                  chipColor = theme.colors.error;
                }

                const gameDate = new Date(game.completedAt || game.createdAt);
                const dateStr = gameDate.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <Box key={game.id}>
                    {index > 0 && <Divider sx={{ borderColor: theme.colors.border }} />}
                    <ListItem disablePadding>
                      <ListItemButton 
                        onClick={() => handleGameClick(game)}
                        sx={{
                          '&:hover': {
                            bgcolor: theme.colors.surfaceLight
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                                vs {opponent?.username || 'Unknown'}
                              </Typography>
                              <Chip 
                                label={resultText} 
                                size="small"
                                sx={{
                                  bgcolor: chipColor,
                                  color: resultText === 'Win' ? '#000' : '#fff',
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box display="flex" gap={2} mt={0.5}>
                              <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                                {isWhite ? '⚪ White' : '⚫ Black'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                                {game.timeControl}
                              </Typography>
                              <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
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
        PaperProps={{
          sx: {
            bgcolor: theme.colors.surface,
            border: `1px solid ${theme.colors.borderGold}`,
            borderRadius: theme.borderRadius.large
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: theme.colors.surfaceLight }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.colors.textPrimary }}>Game Details</Typography>
            <IconButton onClick={handleCloseDetails} size="small" sx={{ color: theme.colors.accent }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedGame && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ color: theme.colors.textSecondary }}>
                    White
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                    {selectedGame.whitePlayer?.username}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.colors.accent }}>
                    {selectedGame.whitePlayer?.elo} rating
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ color: theme.colors.textSecondary }}>
                    Black
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                    {selectedGame.blackPlayer?.username}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.colors.accent }}>
                    {selectedGame.blackPlayer?.elo} rating
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2, borderColor: theme.colors.border }} />

              <Box mb={2}>
                <Typography variant="subtitle2" sx={{ color: theme.colors.textSecondary }} gutterBottom>
                  Result
                </Typography>
                <Typography variant="body1" sx={{ color: theme.colors.textPrimary }}>
                  {selectedGame.result === 0 && '1-0 (White wins)'}
                  {selectedGame.result === 1 && '0-1 (Black wins)'}
                  {selectedGame.result === 2 && '½-½ (Draw)'}
                  {selectedGame.result === 3 && '½-½ (Stalemate)'}
                  {selectedGame.result === 4 && 'Timeout'}
                  {selectedGame.result === 5 && 'Resignation'}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" sx={{ color: theme.colors.textSecondary }} gutterBottom>
                  Time Control
                </Typography>
                <Typography variant="body1" sx={{ color: theme.colors.textPrimary }}>
                  {selectedGame.timeControl}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" sx={{ color: theme.colors.textSecondary }} gutterBottom>
                  Moves
                </Typography>
                <Typography variant="body1" sx={{ color: theme.colors.textPrimary }}>
                  {selectedGame.moves?.length || 0} moves
                </Typography>
              </Box>

              {selectedGame.moves && selectedGame.moves.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: theme.colors.textSecondary }} gutterBottom>
                    Move History
                  </Typography>
                  <Box 
                    sx={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      bgcolor: theme.colors.primary,
                      border: `1px solid ${theme.colors.border}`,
                      p: 2,
                      borderRadius: 1
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        m: 0,
                        color: theme.colors.textPrimary
                      }}
                    >
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
                <Typography variant="caption" sx={{ color: theme.colors.textMuted }}>
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
