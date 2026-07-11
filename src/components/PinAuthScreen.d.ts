interface PinAuthScreenProps {
    onAuthenticate: (pin: string) => Promise<boolean>;
    isLoading?: boolean;
    error?: string;
}
export declare function PinAuthScreen({ onAuthenticate, isLoading, error }: PinAuthScreenProps): any;
export {};
//# sourceMappingURL=PinAuthScreen.d.ts.map