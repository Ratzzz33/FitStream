import React, { useState, useEffect } from 'react';
import { Star, Send, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import {
  rateRecipe,
  getRecipeRating,
  getRecipeComments,
  addRecipeComment,
  RecipeComment
} from '../../services/recipeService';

interface RecipeRatingProps {
  recipeId?: number;  // DB recipe ID (undefined for AI-generated)
  recipeName: string;
  compact?: boolean;  // Compact mode for card preview
}

export const RecipeRating: React.FC<RecipeRatingProps> = ({
  recipeId,
  recipeName,
  compact = false
}) => {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const userId = StorageService.getUserId();
  const settings = StorageService.getSettings();

  // Load rating on mount
  useEffect(() => {
    if (recipeId) {
      loadRating();
    }
  }, [recipeId]);

  const loadRating = async () => {
    if (!recipeId) return;
    try {
      const data = await getRecipeRating(recipeId, userId);
      setAverageRating(data.averageRating);
      setTotalRatings(data.totalRatings);
      setUserRating(data.userRating);
    } catch (err) {
      console.warn('Failed to load rating:', err);
    }
  };

  const loadComments = async () => {
    if (!recipeId) return;
    setLoadingComments(true);
    try {
      const data = await getRecipeComments(recipeId);
      setComments(data);
    } catch (err) {
      console.warn('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!recipeId) {
      // Can't rate AI-generated recipes that aren't in DB yet
      return;
    }

    try {
      const data = await rateRecipe(recipeId, userId, rating);
      setUserRating(rating);
      setAverageRating(data.averageRating);
      setTotalRatings(data.totalRatings);
    } catch (err) {
      console.error('Failed to rate:', err);
    }
  };

  const handleSubmitComment = async () => {
    if (!recipeId || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await addRecipeComment(
        recipeId,
        userId,
        settings.name || 'Аноним',
        newComment.trim()
      );
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  // Render stars
  const renderStars = (interactive: boolean = true) => {
    const displayRating = hoverRating ?? userRating ?? 0;

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => interactive && handleRate(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            disabled={!recipeId || !interactive}
            className={`transition-transform ${interactive && recipeId ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : star <= averageRating
                  ? 'fill-yellow-200 text-yellow-300'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Compact mode - just stars and count
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-3.5 h-3.5 ${
                star <= averageRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
        </div>
        {totalRatings > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {averageRating.toFixed(1)} ({totalRatings})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rating section */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {userRating ? 'Ваша оценка' : 'Оцените рецепт'}
          </p>
          {renderStars(true)}
        </div>

        {totalRatings > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {averageRating.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalRatings} {totalRatings === 1 ? 'оценка' : totalRatings < 5 ? 'оценки' : 'оценок'}
            </p>
          </div>
        )}
      </div>

      {/* Comments toggle */}
      {recipeId && (
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <MessageCircle className="w-4 h-4" />
          {showComments ? 'Скрыть комментарии' : 'Показать комментарии'}
          {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}

      {/* Comments section */}
      {showComments && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          {/* New comment input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Напишите комментарий..."
              maxLength={500}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Comments list */}
          {loadingComments ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              Загрузка...
            </p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              Пока нет комментариев. Будьте первым!
            </p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map(comment => (
                <div
                  key={comment.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {comment.user_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No DB recipe message */}
      {!recipeId && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Этот рецепт создан ИИ. После приготовления вы сможете его оценить.
        </p>
      )}
    </div>
  );
};

export default RecipeRating;
