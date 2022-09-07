import RPi.GPIO as GPIO	#Loading GPIO-Library for Servo Control
import pigpio			#Loading pigpio Library for PWM
import time 			#to handle time-related tasks
import sys
import pickle			#to save variable value and use it again

GPIO.setmode(GPIO.BOARD)	#Zugriff auf Pins nicht GPIOs for RPi.GPIO

#Raspberry Pi Pin-Belegung CL57T Driver
DIR = 35
ENA = 37

pin = 13 # GPIO13 PIN33 for pigpio using BCM Board aka GPIO # not Pin #

#open dummy file, and give the variable dummy the value from the file 
#to prevent motor to stop by btn click, because its starts the script again, need the previous value
filename = 'dummy'
infile = open(filename, 'rb')
dummy = pickle.load(infile)
infile.close()


#req.body.x
freq = int(sys.argv[1])
direction = sys.argv[2]
enable = int(sys.argv[3])

#for dummy value reset
empty_list  = 0

#to access the local Pi's GPIO 
pi = pigpio.pi()

#Set Direction 
if (direction == 'Rechts'):
    direction = GPIO.HIGH
else:
    direction = GPIO.LOW

ENA_Locked = GPIO.LOW
ENA_Released = GPIO.HIGH

#disable warning (to not get warning while configuring script)
GPIO.setwarnings(False)

#Set up channel when using as Input or Output / Define Pin as Output
GPIO.setup(DIR, GPIO.OUT)
GPIO.setup(ENA, GPIO.OUT)

#Activate Motor and Lock it
if ((enable == 1) or (enable == 3)):
    #Start
    GPIO.output(ENA, ENA_Locked)
else: 
    #Stop + Ramp down
    while dummy != 0:
        dummy-=1;
        pi.hardware_PWM(pin, dummy, 500000)
        time.sleep(0.00001)
    GPIO.output(ENA, ENA_Released)
    freq=0	#damit PWM nicht wieder auf vorherige Freq startet
    
#Set Direction
GPIO.output(DIR, direction)

#Set the GPIO-Mode to ALT5 for Hardware-PWM
pi.set_mode(pin, pigpio.ALT5) #ALT5 = PVM0


#Servo Ramp 
while dummy < freq:
    dummy += 1
    #Generate PWM + Ramp up
    pi.hardware_PWM(pin, dummy, 500000)
    time.sleep(0.00001)     
while dummy > freq:
    #um nicht abrupt Frequenz ändern
    dummy -= 1
    pi.hardware_PWM(pin, dummy, 500000)    
# wenn dummy == freq
pi.hardware_PWM(pin, dummy, 500000) #500000 = duty-cycle = 50%
#dummy value in file sichern
outfile = open(filename, 'wb')
pickle.dump(dummy,outfile)
outfile.close()

try:
    #keep script running until Strg+C are pressed
    while True:  
        time.sleep(1)

except KeyboardInterrupt:
    #bei STRG+C + script stops running + ramp down
    while dummy != 0:
        dummy -= 1;
        pi.hardware_PWM(pin, dummy, 500000)
        time.sleep(0.00001)
    #set dummy value in file to 0 for next server.js run (reset dummy value in file)
    outfile = open(filename, 'wb')
    pickle.dump(empty_list, outfile)
    outfile.close()
    pass

#Pull down the GPIO-Pin and cleanup with stop()
pi.write(pin, 0)
pi.stop()

#Release Motor
GPIO.output(ENA, ENA_Released)