import React from 'react';
import { MOCK_SUCCESS_STORIES } from '../../data/mockSuccessStories';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { Heart, Calendar, ThumbsUp, Sparkles } from 'lucide-react';

export const SuccessStoriesPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="gold">
          <Sparkles className="h-3 w-3 mr-1 text-[#8B1E3F]" /> Matrimonial Joy
        </Badge>
        <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
          Vivah Wedding Success Stories
        </h1>
        <p className="text-base text-stone-600 font-medium leading-relaxed">
          Read inspiring wedding journeys from real couples who found their soulmates on Vivah.
        </p>
      </div>

      {/* Grid View */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_SUCCESS_STORIES.map(story => (
            <Card key={story.id} className="overflow-hidden border border-stone-200/80 bg-white shadow-none hover:shadow-none transition-all flex flex-col justify-between rounded-3xl">
              <div>
                <div className="aspect-[16/10] overflow-hidden bg-stone-100 relative">
                  <img
                    src={story.image}
                    alt={story.coupleName}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#8B1E3F] shadow-sm flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 fill-[#8B1E3F]" /> Verified
                  </div>
                </div>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-serif text-xl font-bold text-[#8B1E3F]">{story.coupleName}</h3>
                  <p className="text-xs text-stone-600 font-semibold flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#C44569]" /> {story.weddingDate} • {story.location}
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed italic line-clamp-3">
                    "{story.story}"
                  </p>
                </CardContent>
              </div>
              <div className="p-6 pt-0 flex items-center justify-between border-t border-stone-100 text-xs text-stone-500 mt-2 pt-3">
                <span className="flex items-center gap-1 font-semibold text-rose-700">
                  <ThumbsUp className="h-3.5 w-3.5" /> {story.likes} Blessings
                </span>
                <span className="text-[11px] font-medium text-stone-400">Verified Union</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Grid View */}
      <section className="space-y-6 pt-8 border-t border-stone-200/80">
        <h2 className="font-serif text-2xl font-bold text-stone-900">All Happy Couples</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_SUCCESS_STORIES.map(story => (
            <Card key={story.id} className="overflow-hidden border border-stone-200/80 bg-white shadow-none hover:shadow-none transition-all flex flex-col justify-between rounded-3xl">
              <div>
                <div className="aspect-16/10 overflow-hidden bg-stone-100 relative">
                  <img
                    src={story.image}
                    alt={story.coupleName}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#8B1E3F] shadow-sm flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 fill-[#8B1E3F]" /> Verified
                  </div>
                </div>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-serif text-xl font-bold text-[#8B1E3F]">{story.coupleName}</h3>
                  <p className="text-xs text-stone-600 font-semibold flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#C44569]" /> {story.weddingDate} • {story.location}
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed italic line-clamp-3">
                    "{story.story}"
                  </p>
                </CardContent>
              </div>
              <div className="p-6 pt-0 flex items-center justify-between border-t border-stone-100 text-xs text-stone-500 mt-2 pt-3">
                <span className="flex items-center gap-1 font-semibold text-rose-700">
                  <ThumbsUp className="h-3.5 w-3.5" /> {story.likes} Blessings
                </span>
                <span className="text-[11px] font-medium text-stone-400">Verified Union</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
