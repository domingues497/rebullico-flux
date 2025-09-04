import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface NumericKeypadProps {
  onNumberClick: (number: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEnter: () => void;
}

export function NumericKeypad({ onNumberClick, onBackspace, onClear, onEnter }: NumericKeypadProps) {
  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0', ',', '00']
  ];

  return (
    <Card className="card-flat">
      <CardContent className="p-2">
        <div className="grid grid-cols-3 gap-2">
          {numbers.flat().map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-12 text-lg font-semibold"
              onClick={() => onNumberClick(num)}
            >
              {num}
            </Button>
          ))}
          
          {/* Action buttons */}
          <Button
            variant="destructive"
            className="h-12"
            onClick={onClear}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            className="h-12"
            onClick={onBackspace}
          >
            ⌫
          </Button>
          
          <Button
            className="h-12 btn-pos-primary"
            onClick={onEnter}
          >
            OK
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}