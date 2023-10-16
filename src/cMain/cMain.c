#include <stdio.h>

#include "./modules/cMainModule1.h"
#include "./modules/cMainModule2.h"

#define DELIMITER "-------------------------------------------------\n"

int main(int argc, char **argv)
{
	printf(DELIMITER);

	printf("argc: %d\n", argc);
	printf("argv[0]: %s\n", argv[0]);
	printf("argv[1]: %s\n", argv[1]);
	printf("argv[2]: %s\n", argv[2]);

	aFunction1();
	aFunction2();

	printf(DELIMITER);

	return 0;
}
