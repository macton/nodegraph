use strict;

{
  my $fileBasename = 'igNodeGraph';
  my $file = "$fileBasename.js";
  die "\n * Failed to open '$file' for reading!\n" if ( !open ( IN, "<$file" ) );
  while ( my $line = <IN> )
  {
    if ( $line =~ /\Q$fileBasename\E\.prototype/i )
    {
      chomp $line;
      print "$line\n";
    }
  }
  close IN;
  exit 0;
}