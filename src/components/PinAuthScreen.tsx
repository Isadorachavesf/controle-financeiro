import React, { useState } from 'react';

interface PinAuthScreenProps {
  onAuthenticate: (pin: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string;
}

export function PinAuthScreen({ onAuthenticate, isLoading, error }: PinAuthScreenProps) {
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState('');

  const handlePinClick = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
      setLocalError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setLocalError('PIN deve ter 4 dígitos');
      return;
    }

    const success = await onAuthenticate(pin);
    if (!success) {
      setLocalError('PIN inválido');
      setPin('');
    }
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">💰</div>
          <h1 className="text-2xl font-bold text-gray-800">Controle Financeiro</h1>
          <p className="text-gray-600 mt-2">Digite seu PIN para continuar</p>
        </div>

        {displayError && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PIN Display */}
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="password"
                  value={pin[i] || ''}
                  readOnly
                  maxLength={1}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-blue-400 rounded-lg bg-white text-gray-800"
                />
              ))}
            </div>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinClick(String(num))}
                disabled={pin.length >= 4 || isLoading}
                className="p-4 bg-blue-100 hover:bg-blue-200 text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePinClick('0')}
              disabled={pin.length >= 4 || isLoading}
              className="col-span-2 p-4 bg-blue-100 hover:bg-blue-200 text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={pin.length === 0 || isLoading}
              className="p-4 bg-red-100 hover:bg-red-200 text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ⌫
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={pin.length !== 4 || isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          Versão 1.0.0 • Isadora Chaves
        </p>
      </div>
    </div>
  );
}
