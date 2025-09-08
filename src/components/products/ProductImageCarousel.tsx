import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon } from 'lucide-react';

interface ProductImage {
  id: string;
  url?: string;
  url_link?: string;
  principal: boolean;
}

interface ProductImageCarouselProps {
  images: ProductImage[];
  productName: string;
}

export const ProductImageCarousel = ({ images, productName }: ProductImageCarouselProps) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (imageId: string) => {
    setImageErrors(prev => new Set([...prev, imageId]));
  };

  if (!images || images.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex aspect-square items-center justify-center p-6">
          <div className="text-center">
            <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhuma imagem disponível
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-xs mx-auto">
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((image, index) => {
            const imageUrl = image.url || image.url_link;
            const hasError = imageErrors.has(image.id);

            return (
              <CarouselItem key={image.id}>
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6 relative">
                    {hasError || !imageUrl ? (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground" />
                        <p className="mt-2 text-xs text-muted-foreground">
                          Imagem indisponível
                        </p>
                      </div>
                    ) : (
                      <img
                        src={imageUrl}
                        alt={`${productName} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                        onError={() => handleImageError(image.id)}
                        loading="lazy"
                      />
                    )}
                    {image.principal && (
                      <Badge 
                        className="absolute top-2 right-2" 
                        variant="secondary"
                      >
                        Principal
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>
      {images.length > 1 && (
        <div className="text-center mt-2">
          <p className="text-xs text-muted-foreground">
            {images.length} {images.length === 1 ? 'imagem' : 'imagens'}
          </p>
        </div>
      )}
    </div>
  );
};