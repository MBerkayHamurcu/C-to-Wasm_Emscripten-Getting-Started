#include <emscripten.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define DELIMITER "-------------------------------------------------"

double cFunction1(double jsArgument)
{
	static double increaseValue = 0.5;

	++increaseValue;

	return jsArgument + increaseValue;
}

double cFunction2(double numberToConcat, char *string, int8_t *typedArray,
		  double typedArrayLen)
{
	// using emscripten_log from emscripten.h
	emscripten_log(EM_LOG_CONSOLE, DELIMITER);

	// printing the string argument
	emscripten_log(EM_LOG_CONSOLE,
		       "emscripten_log, cFunction2, string argument:\n%s",
		       string);

	// printing the array argument
	emscripten_log(EM_LOG_CONSOLE,
		       "emscripten_log, cFunction2, array argument:\n");
	for (int i = 0; i < typedArrayLen; ++i) {
		emscripten_log(EM_LOG_CONSOLE, "typedArray[%d] = %hd", i,
			       typedArray[i]);
	}

	// convert number to string
	char numberToStringBuffer[32];
	snprintf(numberToStringBuffer, 32, "%lf", numberToConcat);

	// concatenate argument string and number
	size_t newStringLength = strlen(string) + strlen(numberToStringBuffer);
	realloc(string, newStringLength * sizeof(char));
	strcat(string, numberToStringBuffer);

	emscripten_log(EM_LOG_CONSOLE, DELIMITER);

	return (double)(int)string;
}

void cFunction3(double number, char *string, int32_t *typedArray,
		double typedArrayLen)
{
	emscripten_log(EM_LOG_CONSOLE, DELIMITER);

	// printing the string argument
	emscripten_log(EM_LOG_CONSOLE,
		       "emscripten_log, cFunction3, string argument:\n%s",
		       string);

	// modifying and printing the array argument
	emscripten_log(EM_LOG_CONSOLE,
		       "emscripten_log, cFunction3, array argument:\n");
	for (int i = 0; i < typedArrayLen; ++i) {
		emscripten_log(EM_LOG_CONSOLE, "typedArray[%d] = %d", i,
			       typedArray[i]);
		typedArray[i] += number;
	}

	emscripten_log(EM_LOG_CONSOLE, DELIMITER);

	return;
}
