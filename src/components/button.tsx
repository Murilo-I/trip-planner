import clsx from "clsx";
import { createContext, useContext } from "react";
import { ActivityIndicator, Text, TextProps, TouchableOpacity, TouchableOpacityProps, View } from "react-native";

type Variants = "primary" | "secondary";

type ButtonProps = TouchableOpacityProps & {
    variant?: Variants
    isLoading?: boolean
}

const ThemeContext = createContext<{ variant?: Variants }>({});

function Button({ variant = "primary", children, isLoading, ...rest }: ButtonProps) {
    return (
        <TouchableOpacity
            activeOpacity={.7}
            disabled={isLoading}
            {...rest}
        >
            <View className={clsx(
                "w-full h-10 flex-row items-center justify-center rounded-lg gap-2",
                {
                    "bg-lime-300": variant === "primary",
                    "bg-zinc-800": variant === "secondary"
                }
            )}>
                <ThemeContext.Provider value={{ variant }}>
                    {isLoading ? <ActivityIndicator className="text-lime-950" /> : children}
                </ThemeContext.Provider>
            </View>
        </TouchableOpacity>
    );
}

function Title({ children, ...rest }: TextProps) {
    const { variant } = useContext(ThemeContext);
    return <Text
        className={clsx(
            "text-base font-semibold",
            {
                "text-lime-950": variant === "primary",
                "text-zinc-200": variant === "secondary"
            }
        )}
        {...rest}
    >
        {children}
    </Text>
}

Button.Title = Title;

export { Button };

