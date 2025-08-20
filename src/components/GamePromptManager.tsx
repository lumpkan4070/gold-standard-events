import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Edit2, Plus, Save, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TruthPrompt {
  id: string;
  text: string;
  category: 'icebreakers' | 'party_fun' | 'memory_lane' | 'victory_specials';
  is_active: boolean;
  created_at: string;
}

interface DarePrompt {
  id: string;
  text: string;
  category: 'icebreakers' | 'party_fun' | 'memory_lane' | 'victory_specials';
  is_active: boolean;
  points_reward: number;
  created_at: string;
}

interface GameStats {
  totalTruths: number;
  totalDares: number;
  totalPlays: number;
  popularCategory: string;
}

const GamePromptManager = () => {
  const [truthPrompts, setTruthPrompts] = useState<TruthPrompt[]>([]);
  const [darePrompts, setDarePrompts] = useState<DarePrompt[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalTruths: 0,
    totalDares: 0,
    totalPlays: 0,
    popularCategory: ''
  });
  const [editingTruth, setEditingTruth] = useState<TruthPrompt | null>(null);
  const [editingDare, setEditingDare] = useState<DarePrompt | null>(null);
  const [isAddingTruth, setIsAddingTruth] = useState(false);
  const [isAddingDare, setIsAddingDare] = useState(false);

  // New prompt forms
  const [newTruth, setNewTruth] = useState<{
    text: string;
    category: 'icebreakers' | 'party_fun' | 'memory_lane' | 'victory_specials';
  }>({
    text: '',
    category: 'icebreakers'
  });
  const [newDare, setNewDare] = useState<{
    text: string;
    category: 'icebreakers' | 'party_fun' | 'memory_lane' | 'victory_specials';
    points_reward: number;
  }>({
    text: '',
    category: 'icebreakers',
    points_reward: 10
  });

  useEffect(() => {
    loadGameData();
    loadGameStats();
  }, []);

  const loadGameData = async () => {
    try {
      // Load all truth prompts
      const { data: truths, error: truthError } = await supabase
        .from('truth_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (truthError) throw truthError;

      // Load all dare prompts
      const { data: dares, error: dareError } = await supabase
        .from('dare_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (dareError) throw dareError;

      setTruthPrompts(truths || []);
      setDarePrompts(dares || []);
    } catch (error) {
      console.error('Error loading game data:', error);
      toast.error('Failed to load game data');
    }
  };

  const loadGameStats = async () => {
    try {
      // Get basic counts
      const { data: gameActivity } = await supabase
        .from('user_game_activity')
        .select('prompt_type, completion_data');

      const totalPlays = gameActivity?.length || 0;
      
      // Count categories
      const categoryCounts: { [key: string]: number } = {};
      gameActivity?.forEach(activity => {
        if (activity.completion_data && typeof activity.completion_data === 'object') {
          const category = (activity.completion_data as any)?.category || 'unknown';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });

      const popularCategory = Object.keys(categoryCounts).reduce((a, b) => 
        categoryCounts[a] > categoryCounts[b] ? a : b, 'icebreakers');

      setGameStats({
        totalTruths: truthPrompts.length,
        totalDares: darePrompts.length,
        totalPlays,
        popularCategory
      });
    } catch (error) {
      console.error('Error loading game stats:', error);
    }
  };

  const addTruthPrompt = async () => {
    if (!newTruth.text.trim()) {
      toast.error('Please enter a truth prompt');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('truth_prompts')
        .insert(newTruth)
        .select()
        .single();

      if (error) throw error;

      setTruthPrompts(prev => [data, ...prev]);
      setNewTruth({ text: '', category: 'icebreakers' });
      setIsAddingTruth(false);
      toast.success('Truth prompt added successfully');
    } catch (error) {
      console.error('Error adding truth prompt:', error);
      toast.error('Failed to add truth prompt');
    }
  };

  const addDarePrompt = async () => {
    if (!newDare.text.trim()) {
      toast.error('Please enter a dare prompt');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('dare_prompts')
        .insert(newDare)
        .select()
        .single();

      if (error) throw error;

      setDarePrompts(prev => [data, ...prev]);
      setNewDare({ text: '', category: 'icebreakers', points_reward: 10 });
      setIsAddingDare(false);
      toast.success('Dare prompt added successfully');
    } catch (error) {
      console.error('Error adding dare prompt:', error);
      toast.error('Failed to add dare prompt');
    }
  };

  const updateTruthPrompt = async (prompt: TruthPrompt) => {
    try {
      const { error } = await supabase
        .from('truth_prompts')
        .update({
          text: prompt.text,
          category: prompt.category,
          is_active: prompt.is_active
        })
        .eq('id', prompt.id);

      if (error) throw error;

      setTruthPrompts(prev => 
        prev.map(p => p.id === prompt.id ? prompt : p)
      );
      setEditingTruth(null);
      toast.success('Truth prompt updated successfully');
    } catch (error) {
      console.error('Error updating truth prompt:', error);
      toast.error('Failed to update truth prompt');
    }
  };

  const updateDarePrompt = async (prompt: DarePrompt) => {
    try {
      const { error } = await supabase
        .from('dare_prompts')
        .update({
          text: prompt.text,
          category: prompt.category,
          is_active: prompt.is_active,
          points_reward: prompt.points_reward
        })
        .eq('id', prompt.id);

      if (error) throw error;

      setDarePrompts(prev => 
        prev.map(p => p.id === prompt.id ? prompt : p)
      );
      setEditingDare(null);
      toast.success('Dare prompt updated successfully');
    } catch (error) {
      console.error('Error updating dare prompt:', error);
      toast.error('Failed to update dare prompt');
    }
  };

  const deleteTruthPrompt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('truth_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTruthPrompts(prev => prev.filter(p => p.id !== id));
      toast.success('Truth prompt deleted successfully');
    } catch (error) {
      console.error('Error deleting truth prompt:', error);
      toast.error('Failed to delete truth prompt');
    }
  };

  const deleteDarePrompt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dare_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDarePrompts(prev => prev.filter(p => p.id !== id));
      toast.success('Dare prompt deleted successfully');
    } catch (error) {
      console.error('Error deleting dare prompt:', error);
      toast.error('Failed to delete dare prompt');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'icebreakers': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'party_fun': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'memory_lane': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'victory_specials': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Truth Prompts</p>
              <p className="text-2xl font-bold text-blue-600">{gameStats.totalTruths}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Dare Prompts</p>
              <p className="text-2xl font-bold text-purple-600">{gameStats.totalDares}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Plays</p>
              <p className="text-2xl font-bold text-green-600">{gameStats.totalPlays}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Popular Category</p>
              <p className="text-lg font-semibold capitalize">
                {gameStats.popularCategory.replace('_', ' ')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="truths" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="truths">Truth Prompts</TabsTrigger>
          <TabsTrigger value="dares">Dare Prompts</TabsTrigger>
        </TabsList>

        {/* Truth Prompts Tab */}
        <TabsContent value="truths" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manage Truth Prompts</h3>
            <Dialog open={isAddingTruth} onOpenChange={setIsAddingTruth}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Truth
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Truth Prompt</DialogTitle>
                  <DialogDescription>
                    Create a new truth prompt for the game
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="truth-text">Prompt Text</Label>
                    <Textarea
                      id="truth-text"
                      placeholder="What's your most embarrassing moment?"
                      value={newTruth.text}
                      onChange={(e) => setNewTruth(prev => ({ ...prev, text: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="truth-category">Category</Label>
                    <Select 
                      value={newTruth.category} 
                      onValueChange={(value: 'icebreakers' | 'party_fun' | 'memory_lane' | 'victory_specials') => setNewTruth(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="icebreakers">Icebreakers</SelectItem>
                        <SelectItem value="party_fun">Party Fun</SelectItem>
                        <SelectItem value="memory_lane">Memory Lane</SelectItem>
                        <SelectItem value="victory_specials">Victory Specials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addTruthPrompt} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingTruth(false)} className="flex-1">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {truthPrompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardContent className="p-4">
                  {editingTruth?.id === prompt.id ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editingTruth.text}
                        onChange={(e) => setEditingTruth(prev => 
                          prev ? { ...prev, text: e.target.value } : null
                        )}
                      />
                      <div className="flex items-center gap-4">
                        <Select
                          value={editingTruth.category}
                          onValueChange={(value: 'icebreakers' | 'party_fun' | 'memory_lane' | 'victory_specials') => setEditingTruth(prev => 
                            prev ? { ...prev, category: value } : null
                          )}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="icebreakers">Icebreakers</SelectItem>
                            <SelectItem value="party_fun">Party Fun</SelectItem>
                            <SelectItem value="memory_lane">Memory Lane</SelectItem>
                            <SelectItem value="victory_specials">Victory Specials</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editingTruth.is_active}
                            onCheckedChange={(checked) => setEditingTruth(prev => 
                              prev ? { ...prev, is_active: checked } : null
                            )}
                          />
                          <Label>Active</Label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => updateTruthPrompt(editingTruth)} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditingTruth(null)} size="sm">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">{prompt.text}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(prompt.category)}>
                            {prompt.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                            {prompt.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTruth(prompt)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteTruthPrompt(prompt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Dare Prompts Tab */}
        <TabsContent value="dares" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manage Dare Prompts</h3>
            <Dialog open={isAddingDare} onOpenChange={setIsAddingDare}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dare
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Dare Prompt</DialogTitle>
                  <DialogDescription>
                    Create a new dare prompt for the game
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dare-text">Prompt Text</Label>
                    <Textarea
                      id="dare-text"
                      placeholder="Take a group selfie with silly faces"
                      value={newDare.text}
                      onChange={(e) => setNewDare(prev => ({ ...prev, text: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dare-category">Category</Label>
                        <Select
                          value={newDare.category}
                          onValueChange={(value: 'icebreakers' | 'party_fun' | 'memory_lane' | 'victory_specials') => setNewDare(prev => ({ ...prev, category: value }))}
                        >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="icebreakers">Icebreakers</SelectItem>
                        <SelectItem value="party_fun">Party Fun</SelectItem>
                        <SelectItem value="memory_lane">Memory Lane</SelectItem>
                        <SelectItem value="victory_specials">Victory Specials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dare-points">Victory Points Reward</Label>
                    <Input
                      id="dare-points"
                      type="number"
                      min="5"
                      max="50"
                      value={newDare.points_reward}
                      onChange={(e) => setNewDare(prev => ({ 
                        ...prev, 
                        points_reward: parseInt(e.target.value) || 10 
                      }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addDarePrompt} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingDare(false)} className="flex-1">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {darePrompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardContent className="p-4">
                  {editingDare?.id === prompt.id ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editingDare.text}
                        onChange={(e) => setEditingDare(prev => 
                          prev ? { ...prev, text: e.target.value } : null
                        )}
                      />
                      <div className="flex items-center gap-4">
                        <Select
                          value={editingDare.category}
                          onValueChange={(value: 'icebreakers' | 'party_fun' | 'memory_lane' | 'victory_specials') => setEditingDare(prev => 
                            prev ? { ...prev, category: value } : null
                          )}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="icebreakers">Icebreakers</SelectItem>
                            <SelectItem value="party_fun">Party Fun</SelectItem>
                            <SelectItem value="memory_lane">Memory Lane</SelectItem>
                            <SelectItem value="victory_specials">Victory Specials</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="5"
                          max="50"
                          className="w-32"
                          value={editingDare.points_reward}
                          onChange={(e) => setEditingDare(prev => 
                            prev ? { ...prev, points_reward: parseInt(e.target.value) || 10 } : null
                          )}
                        />
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editingDare.is_active}
                            onCheckedChange={(checked) => setEditingDare(prev => 
                              prev ? { ...prev, is_active: checked } : null
                            )}
                          />
                          <Label>Active</Label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => updateDarePrompt(editingDare)} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditingDare(null)} size="sm">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">{prompt.text}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(prompt.category)}>
                            {prompt.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <Badge variant="outline">
                            {prompt.points_reward} Points
                          </Badge>
                          <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                            {prompt.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingDare(prompt)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteDarePrompt(prompt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamePromptManager;